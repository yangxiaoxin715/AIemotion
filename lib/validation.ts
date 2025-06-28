import { z } from 'zod'

// 情绪分析输入验证
export const EmotionAnalysisInputSchema = z.object({
  text: z.string()
    .min(1, '文本内容不能为空')
    .max(5000, '文本内容不能超过5000字符')
    .refine(
      (text) => text.trim().length > 0,
      '文本内容不能只包含空格'
    )
})

// 周报生成输入验证
export const WeeklyReportInputSchema = z.object({
  records: z.array(z.object({
    id: z.string(),
    timestamp: z.string(),
    emotionData: z.object({
      transcript: z.string(),
      emotionWords: z.array(z.object({
        word: z.string(),
        count: z.number().min(0)
      })),
      insights: z.array(z.string()),
      fourQuestionsAnalysis: z.object({
        feeling: z.string(),
        needs: z.string(),
        challenges: z.string(),
        insights: z.string()
      }),
      growthSummary: z.object({
        discovered: z.string(),
        reminder: z.string()
      }),
      suggestedBenefits: z.array(z.string()),
      selectedBenefits: z.array(z.string())
    }),
    sessionNumber: z.number().min(1).max(7),
    cycleNumber: z.number().min(1)
  }))
    .min(1, '至少需要一条记录')
    .max(7, '最多支持7条记录')
})

// 文本清理和验证
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 移除控制字符
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 移除script标签
    .replace(/<[^>]*>/g, '') // 移除HTML标签
    .slice(0, 5000) // 限制长度
}

// API错误处理
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// 错误响应格式化
export function formatErrorResponse(error: unknown) {
  if (error instanceof APIError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode
    }
  }

  if (error instanceof z.ZodError) {
    return {
      error: '输入数据格式错误',
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
    }
  }

  if (error instanceof Error) {
    // 不要在生产环境暴露详细错误信息
    const message = process.env.NODE_ENV === 'development' 
      ? error.message 
      : '服务器内部错误'
    
    return {
      error: message,
      code: 'INTERNAL_ERROR',
      statusCode: 500
    }
  }

  return {
    error: '未知错误',
    code: 'UNKNOWN_ERROR',
    statusCode: 500
  }
}

// 速率限制检查（简单实现）
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(identifier)

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (limit.count >= maxRequests) {
    return false
  }

  limit.count++
  return true
}

// 获取客户端IP（用于速率限制）
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
}