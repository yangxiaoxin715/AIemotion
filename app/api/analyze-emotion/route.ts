import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { EmotionAnalysisInputSchema, sanitizeText, formatErrorResponse, checkRateLimit, getClientIP, APIError } from '@/lib/validation'

// 初始化OpenAI客户端 - 增加超时时间
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000, // 60秒超时
  maxRetries: 3,  // 最多重试3次
})

export async function POST(request: NextRequest) {
  try {
    // 速率限制检查
    const clientIP = getClientIP(request)
    if (!checkRateLimit(clientIP, 10, 60000)) {
      throw new APIError('请求过于频繁，请稍后再试', 429, 'RATE_LIMIT_EXCEEDED')
    }

    // 获取和验证请求体
    const body = await request.json().catch(() => {
      throw new APIError('请求体格式错误', 400, 'INVALID_JSON')
    })

    // 输入验证
    const validationResult = EmotionAnalysisInputSchema.safeParse(body)
    if (!validationResult.success) {
      throw new APIError('输入数据格式错误', 400, 'VALIDATION_ERROR')
    }

    const { text } = validationResult.data
    
    // 文本清理
    const sanitizedText = sanitizeText(text)
    if (sanitizedText.length === 0) {
      throw new APIError('文本内容无效', 400, 'INVALID_TEXT')
    }

    // 检查API密钥
    if (!process.env.OPENAI_API_KEY) {
      throw new APIError('AI服务暂时不可用', 503, 'SERVICE_UNAVAILABLE')
    }

    console.log('开始调用OpenAI API...')
    console.log('使用模型:', process.env.OPENAI_MODEL || 'gpt-3.5-turbo')
    console.log('文本长度:', text.length)
    
    // 调用OpenAI进行情感分析
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `你是用户最亲密的情感伙伴，一个既温暖又敏锐的朋友。用户刚刚向你倾诉了内心的感受，请用最真诚、最贴近的方式回应。

想象你就坐在用户身边，能感受到ta的情绪，用朋友般的语言与ta对话，而不是冷冰冰的分析报告。

**核心任务1：情绪词汇识别**
请仔细分析用户的表达，识别出所有显性和隐性的情绪词汇。不仅要找出直接的情绪词（如"开心"、"难过"），还要从语境中推断情绪状态：
- 直接情绪词：开心、难过、焦虑、兴奋、失望、愤怒、平静等
- 语境情绪词：从描述中推断的情绪状态，如"感觉很累"→疲惫，"不知道怎么办"→迷茫
- 至少识别出3-5个情绪词汇，如果用户表达比较中性，也要从细微的语气中找出情绪倾向

**核心任务2：好处建议**
在"suggestedBenefits"中，请为用户提供4-5个具体的、积极的好处选项，让ta可以主动选择哪些值得"攒起来"。这些好处应该：
- 基于ta真实的表达内容
- 突出ta的优点、成长和积极面
- 像朋友夸奖一样温暖具体
- 让ta感到被肯定和鼓励

返回JSON格式：
{
  "emotionWords": [
    {"word": "具体的情绪词汇", "count": 在表达中出现的次数或强度1-3}, 
    {"word": "另一个情绪词", "count": 2},
    {"word": "至少要有3-5个情绪词", "count": 1}
  ],
  "insights": ["用朋友的语气回应的洞察", "第二个温暖的观察", "第三个走心的理解"],
  "fourQuestionsAnalysis": {
    "feeling": "用'我听到了...'、'我感受到...'这样的开头，像朋友一样回应ta的感受",
    "needs": "用'也许你现在最需要的是...'这样温暖的语气来分析ta的需求",
    "challenges": "用'我觉得最难的可能是...'来理解ta的困难",
    "insights": "用'有没有发现...'、'也许...'来提供新的视角"
  },
  "growthSummary": {
    "discovered": "用'通过这次聊天，你可能意识到...'来总结成长",
    "reminder": "用'想对未来的你说...'来给出温暖的提醒"
  },
  "suggestedBenefits": ["我觉得你可以攒下这个好处：...", "还有这个值得记住：...", "这个也很珍贵：...", "也许这个对你很重要：..."]
}

**重要提醒：emotionWords数组绝不能为空！即使用户表达很平静，也要找出至少3个相关的情绪状态词汇。**

语言风格要求：
✅ 像朋友聊天一样自然、温暖
✅ 用"我听到了..."、"我感受到..."、"也许..."这样的开头
✅ 避免"用户"、"分析"、"识别"等冷冰冰的词汇
✅ 多用"你"而不是"用户"来称呼
✅ 情绪共鸣优先，理论分析次之
✅ 像在微信聊天一样真诚和贴近

❌ 避免学术化、理论化的语言
❌ 不要像心理学教科书
❌ 不要用"显示"、"表明"、"反映"等分析词汇
❌ 不要太正式或距离感强的表达`
        },
        {
          role: 'user',
          content: `请分析：${sanitizedText}`
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
    })

    console.log('OpenAI API调用成功')

    const result = completion.choices[0]?.message?.content

    if (!result) {
      throw new Error('AI响应为空')
    }

    // 尝试解析JSON响应
    let analysisResult
    let cleanResult = result.trim()
    
    console.log('AI原始响应长度:', result.length)
    console.log('AI原始响应前200字符:', result.substring(0, 200))
    
    try {
      // 处理可能被包装在markdown代码块中的JSON
      // 检查是否被```json包装
      if (cleanResult.startsWith('```json')) {
        cleanResult = cleanResult.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanResult.startsWith('```')) {
        cleanResult = cleanResult.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      analysisResult = JSON.parse(cleanResult)
      console.log('JSON解析成功')
      console.log('解析结果的emotionWords:', analysisResult.emotionWords)
    } catch (parseError) {
      console.error('JSON解析失败:', parseError)
      console.error('原始响应:', result)
      console.error('清理后响应:', cleanResult)
      
      // 如果JSON解析失败，返回备用结果
      // 尝试从用户文本中简单提取一些情绪词汇
      const defaultEmotionWords = [
        { word: "表达", count: 1 },
        { word: "思考", count: 1 },
        { word: "感受", count: 1 }
      ]
      
      // 简单的情绪词检测（备用方案）
      const emotionKeywords = [
        { words: ["开心", "高兴", "愉快", "快乐", "兴奋"], emotion: "开心" },
        { words: ["难过", "悲伤", "沮丧", "失落"], emotion: "难过" },
        { words: ["焦虑", "担心", "紧张", "害怕"], emotion: "焦虑" },
        { words: ["愤怒", "生气", "恼火", "愤慨"], emotion: "愤怒" },
        { words: ["疲惫", "累", "疲劳", "疲倦"], emotion: "疲惫" },
        { words: ["迷茫", "困惑", "不知所措"], emotion: "迷茫" },
        { words: ["平静", "安静", "淡定"], emotion: "平静" },
        { words: ["压力", "压抑", "窒息"], emotion: "压力" }
      ]
      
      const detectedEmotions: { word: string; count: number }[] = []
      const lowerText = text.toLowerCase()
      
      emotionKeywords.forEach(({ words, emotion }) => {
        const count = words.reduce((total, word) => {
          const matches = (lowerText.match(new RegExp(word, 'g')) || []).length
          return total + matches
        }, 0)
        if (count > 0) {
          detectedEmotions.push({ word: emotion, count })
        }
      })
      
      // 如果没有检测到情绪词，使用默认的
      const finalEmotionWords = detectedEmotions.length > 0 ? detectedEmotions : defaultEmotionWords
      
      analysisResult = {
        emotionWords: finalEmotionWords,
        insights: [
          "感谢你的真诚分享，这需要勇气",
          "每一次表达都是自我觉察的开始",
          "你的感受都是珍贵和有价值的"
        ],
        fourQuestionsAnalysis: {
          feeling: "从你的表达中，我感受到你内心有着复杂而真实的情绪",
          needs: "你可能需要被理解、被接纳，以及一个安全的空间来表达自己",
          challenges: "当前的主要挑战可能是如何更好地理解和表达自己的感受",
          insights: "你已经迈出了重要的一步——愿意诚实地面对和表达自己的感受"
        },
        growthSummary: {
          discovered: "你发现了自己有勇气面对和表达内心的感受，这是自我成长的重要能力",
          reminder: "记住，每一次真诚的表达都是成长，给自己一些耐心和关爱"
        },
        suggestedBenefits: [
          "你有勇气面对和表达真实的感受",
          "你正在主动寻求自我理解和成长",
          "你愿意花时间关注自己的内心世界",
          "你有自我觉察的能力和意愿"
        ]
      }
    }

    // 返回分析结果
    const finalResult = {
      transcript: sanitizedText,
      emotionWords: analysisResult.emotionWords || [],
      insights: analysisResult.insights || [],
      fourQuestionsAnalysis: analysisResult.fourQuestionsAnalysis || {},
      growthSummary: analysisResult.growthSummary || {},
      suggestedBenefits: analysisResult.suggestedBenefits || [],
      selectedBenefits: [] // 初始为空，等待用户选择
    }
    
    console.log('最终返回的emotionWords:', finalResult.emotionWords)
    console.log('emotionWords数组长度:', finalResult.emotionWords.length)
    
    return NextResponse.json(finalResult)

  } catch (error) {
    console.error('情感分析API错误:', error)
    
    // OpenAI特定错误处理
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        error = new APIError('网络连接超时，请稍后重试', 504, 'TIMEOUT')
      } else if (error.message.includes('401') || error.message.includes('Invalid API key')) {
        error = new APIError('AI服务配置错误', 503, 'SERVICE_ERROR')
      } else if (error.message.includes('insufficient_quota')) {
        error = new APIError('AI服务配额不足，请稍后重试', 503, 'QUOTA_EXCEEDED')
      } else if (error.message.includes('model_not_found')) {
        error = new APIError('AI模型不可用', 503, 'MODEL_UNAVAILABLE')
      } else if (!error.name || error.name === 'Error') {
        error = new APIError('AI分析失败，请稍后重试', 500, 'AI_ERROR')
      }
    }
    
    const errorResponse = formatErrorResponse(error)
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode })
  }
} 