import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { EmotionRecord, WeeklyReport } from '@/lib/emotion-tracker'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { records }: { records: EmotionRecord[] } = await request.json()

    if (!records || records.length !== 7) {
      return NextResponse.json(
        { error: '需要提供完整的7次情绪记录' },
        { status: 400 }
      )
    }

    // 构建分析内容
    const recordsText = records.map((record, index) => {
      const date = new Date(record.timestamp).toLocaleDateString('zh-CN')
      const emotionWords = record.emotionData.emotionWords.map(w => `${w.word}(${w.count}次)`).join(', ')
      const insights = record.emotionData.insights.join('; ')
      
      return `第${index + 1}天 (${date}):
- 情绪词汇: ${emotionWords}
- AI洞察: ${insights}
- 核心感受: ${record.emotionData.fourQuestionsAnalysis.feeling}
- 内在需求: ${record.emotionData.fourQuestionsAnalysis.needs}
- 关键挑战: ${record.emotionData.fourQuestionsAnalysis.challenges}
- 新发现: ${record.emotionData.fourQuestionsAnalysis.insights}`
    }).join('\n\n')

    const prompt = `你是用户最懂ta的情感伙伴，陪伴ta走过了整整7天的情绪之旅。现在，你要像最亲密的朋友一样，为ta写一份走心的成长纪念册。

这是你们7天来的情感对话记录：
${recordsText}

想象你是ta最好的朋友，见证了ta这7天的每一次勇敢表达，每一个情绪起伏，每一次内心挣扎和成长。用最真诚、最温暖的语言，为ta写下这份特殊的"情感成长相册"。

请用朋友的语气写下：

💫 **我看到的你**（insights）：
- 用"我看到你..."、"这7天里，你..."这样的开头
- 3-4条走心的观察，像朋友一样指出ta的特质和变化
- 要有具体的例子，不要空泛的鼓励

🌱 **你的成长轨迹**（personalGrowth）：
- 用"从第一天到现在..."、"我发现你慢慢..."这样的开头
- 像朋友一样讲述ta的成长故事
- 要有温度，让ta感受到自己真的在变化

💝 **想给你的建议**（recommendations）：
- 用"我觉得你可以试试..."、"如果是我的话..."这样的开头
- 3-4条贴心的建议，像朋友聊天一样自然
- 要实用，不要说教

🎉 **为你骄傲**（progressSummary）：
- 用"真的为你感到骄傲..."、"看着你这7天..."这样的开头
- 像朋友一样真诚地为ta庆祝
- 要有感染力，让ta觉得自己很棒

语言风格：
✅ 像微信聊天一样温暖自然
✅ 多用"你"，让ta感受到被看见
✅ 举具体例子，比如"记得第3天你说..."
✅ 情感共鸣，不要干巴巴的分析
✅ 像朋友一样真诚和贴近

❌ 不要用"用户"、"分析"、"数据"等冷冰冰的词
❌ 不要像心理学报告
❌ 不要太正式或有距离感

请用JSON格式返回，让每句话都带着温度。`

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: '你是一位专业的心理情绪分析师，擅长从多次情绪记录中识别模式、分析成长轨迹，并提供温暖有建设性的建议。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const result = completion.choices[0]?.message?.content

    if (!result) {
      throw new Error('未能获取AI分析结果')
    }

    // 尝试解析JSON结果
    let analysisData
    let cleanResult = result.trim()
    
    try {
      // 处理可能被包装在markdown代码块中的JSON
      if (cleanResult.startsWith('```json')) {
        cleanResult = cleanResult.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (cleanResult.startsWith('```')) {
        cleanResult = cleanResult.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      // 尝试提取JSON对象
      const jsonMatch = cleanResult.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('未找到JSON格式的分析结果')
      }
      
      // 验证数据结构
      if (!analysisData.insights || !Array.isArray(analysisData.insights)) {
        analysisData.insights = ['我看到你这7天里的勇敢和坚持', '你的情绪表达越来越真实和深入', '感受到你对自我成长的渴望']
      }
      if (!analysisData.recommendations || !Array.isArray(analysisData.recommendations)) {
        analysisData.recommendations = ['我觉得你可以试试继续保持这种情绪觉察', '如果是我的话，会给自己更多的耐心和关爱', '也许可以把这些洞察记录下来']
      }
      
      console.log('周报JSON解析成功')
    } catch (parseError) {
      // 如果JSON解析失败，使用备用解析方法
      console.error('周报JSON解析失败，使用备用方法:', parseError)
      console.error('原始响应:', result)
      console.error('清理后响应:', cleanResult)
      
      analysisData = {
        insights: [
          '我看到你这7天里一直在勇敢地面对和表达自己的感受', 
          '你的每一次倾诉都展现了对自我成长的渴望', 
          '从你的表达中，我感受到了你内心的力量和韧性'
        ],
        personalGrowth: '从第一天到现在，我发现你慢慢学会了更深入地觉察自己的情绪。你不再只是表达表面的感受，而是开始探索内心更深层的需求和想法。这种成长真的很珍贵。',
        recommendations: [
          '我觉得你可以试试每天花几分钟静下来感受自己的情绪', 
          '如果是我的话，会把这些洞察写在日记里，慢慢积累', 
          '也许可以找信任的朋友分享，获得更多支持'
        ],
        progressSummary: '真的为你感到骄傲！看着你这7天从开始的尝试到现在的坚持，每一次表达都是成长。你已经建立了很好的情绪觉察习惯，这将是你人生路上最珍贵的能力之一。'
      }
    }

    // 计算情绪趋势数据
    const emotionTrends = records.map((record, index) => {
      const dominantEmotion = record.emotionData.emotionWords.length > 0 
        ? record.emotionData.emotionWords[0].word 
        : '平静'
      
      const intensity = record.emotionData.emotionWords.reduce((sum, item) => sum + item.count, 0)
      
      return {
        session: index + 1,
        dominantEmotion,
        intensity: Math.min(intensity * 10, 100),
        date: new Date(record.timestamp).toLocaleDateString('zh-CN')
      }
    })

    const weeklyReport: WeeklyReport = {
      startDate: records[0].timestamp,
      endDate: records[6].timestamp,
      totalSessions: 7,
      emotionTrends,
      insights: analysisData.insights || [],
      personalGrowth: analysisData.personalGrowth || '',
      recommendations: analysisData.recommendations || [],
      progressSummary: analysisData.progressSummary || ''
    }

    return NextResponse.json(weeklyReport)

  } catch (error: any) {
    console.error('生成周报失败:', error)
    
    return NextResponse.json(
      { 
        error: '生成情绪周报失败',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
