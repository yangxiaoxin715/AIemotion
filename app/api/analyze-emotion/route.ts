import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'

// 初始化OpenAI客户端 - 增加超时时间
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000, // 60秒超时
  maxRetries: 3,  // 最多重试3次
})

export async function POST(request: NextRequest) {
  try {
    // 获取请求体中的文本
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '请提供有效的文本内容' },
        { status: 400 }
      )
    }

    // 检查API密钥
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'API密钥未配置' },
        { status: 500 }
      )
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

特别重要：在"suggestedBenefits"中，请为用户提供4-5个具体的、积极的好处选项，让ta可以主动选择哪些值得"攒起来"。这些好处应该：
- 基于ta真实的表达内容
- 突出ta的优点、成长和积极面
- 像朋友夸奖一样温暖具体
- 让ta感到被肯定和鼓励

返回JSON格式：
{
  "emotionWords": [{"word": "情绪词汇", "count": 出现次数}],
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
          content: `请分析：${text}`
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
    } catch (parseError) {
      console.error('JSON解析失败:', parseError)
      console.error('原始响应:', result)
      console.error('清理后响应:', cleanResult)
      
      // 如果JSON解析失败，返回备用结果
      analysisResult = {
        emotionWords: [
          { word: "表达", count: 1 },
          { word: "感受", count: 1 }
        ],
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
    return NextResponse.json({
      transcript: text,
      emotionWords: analysisResult.emotionWords || [],
      insights: analysisResult.insights || [],
      fourQuestionsAnalysis: analysisResult.fourQuestionsAnalysis || {},
      growthSummary: analysisResult.growthSummary || {},
      suggestedBenefits: analysisResult.suggestedBenefits || [],
      selectedBenefits: [] // 初始为空，等待用户选择
    })

  } catch (error) {
    console.error('情感分析API错误:', error)
    
    let errorMessage = '分析过程中出现错误，请稍后重试'
    let statusCode = 500
    
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = '网络连接超时，请检查网络或稍后重试'
        statusCode = 504
      } else if (error.message.includes('401') || error.message.includes('Invalid API key')) {
        errorMessage = 'API密钥无效，请检查配置'
        statusCode = 401
      } else if (error.message.includes('insufficient_quota')) {
        errorMessage = 'API配额不足，请充值后重试'
        statusCode = 402
      } else if (error.message.includes('model_not_found')) {
        errorMessage = '模型不可用，请联系管理员'
        statusCode = 404
      }
    }
    
    // 返回错误信息
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.message : '未知错误',
        suggestion: '您可以尝试刷新页面或稍后重试'
      },
      { status: statusCode }
    )
  }
} 