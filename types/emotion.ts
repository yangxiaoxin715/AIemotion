// 情绪分析相关类型定义

// 情绪词汇类型
export interface EmotionWord {
  word: string
  count: number
  intensity?: number
  category?: 'positive' | 'negative' | 'neutral'
}

// 四个问题分析类型
export interface FourQuestionsAnalysis {
  feeling: string      // 当前感受
  needs: string        // 内在需求  
  challenges: string   // 面临挑战
  insights: string     // 新的洞察
}

// 成长总结类型
export interface GrowthSummary {
  discovered: string   // 发现了什么
  reminder: string     // 给自己的提醒
}

// 完整的情绪数据类型
export interface EmotionData {
  transcript: string                    // 原始转录文本
  emotionWords: EmotionWord[]          // 识别的情绪词汇
  insights: string[]                   // AI洞察
  fourQuestionsAnalysis: FourQuestionsAnalysis  // 四个问题分析
  growthSummary: GrowthSummary        // 成长总结
  suggestedBenefits: string[]         // AI建议的好处选项
  selectedBenefits: string[]          // 用户选择的好处
  confidence?: number                 // AI分析置信度
  processingTime?: number             // 处理时间(ms)
  version?: string                    // 数据版本
}

// 情绪记录类型
export interface EmotionRecord {
  id: string
  timestamp: string
  emotionData: EmotionData
  sessionNumber: number
  cycleNumber: number
  metadata?: {
    userAgent?: string
    deviceType?: 'mobile' | 'desktop'
    duration?: number
  }
}

// 情绪趋势数据类型
export interface EmotionTrend {
  session: number
  dominantEmotion: string
  intensity: number
  date: string
  emotionWords: EmotionWord[]
  averageIntensity?: number
}

// 周报类型
export interface WeeklyReport {
  startDate: string
  endDate: string
  totalSessions: number
  emotionTrends: EmotionTrend[]
  insights: string[]
  personalGrowth: string
  recommendations: string[]
  progressSummary: string
  statistics?: {
    totalWords: number
    averageSessionDuration: number
    mostFrequentEmotions: EmotionWord[]
    improvementAreas: string[]
  }
}

// 会话信息类型
export interface SessionInfo {
  sessionNumber: number
  shouldGenerateReport: boolean
  cycleNumber: number
  startTime: string
  completedSessions?: number
  nextMilestone?: number
}

// 应用步骤类型
export type AppStep = 'welcome' | 'expression' | 'analysis' | 'completion' | 'weekly-report'

// 分析状态类型
export interface AnalysisState {
  isAnalyzing: boolean
  progress: number
  currentStep: string
  error: string | null
}

// 情绪类别枚举
export enum EmotionCategory {
  JOY = 'joy',
  SADNESS = 'sadness', 
  ANGER = 'anger',
  FEAR = 'fear',
  SURPRISE = 'surprise',
  DISGUST = 'disgust',
  NEUTRAL = 'neutral',
  MIXED = 'mixed'
}

// 情绪强度等级
export enum EmotionIntensity {
  VERY_LOW = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4,
  VERY_HIGH = 5
}

// 分析配置类型
export interface AnalysisConfig {
  language: string
  enableEmotionDetection: boolean
  enableInsightGeneration: boolean
  enableGrowthAnalysis: boolean
  confidenceThreshold: number
  maxProcessingTime: number
}

// 用户偏好设置类型
export interface UserPreferences {
  language: 'zh-CN' | 'en-US'
  enableNotifications: boolean
  autoSaveRecords: boolean
  shareAnalytics: boolean
  reminderFrequency: 'daily' | 'weekly' | 'never'
  preferredAnalysisDepth: 'basic' | 'detailed' | 'comprehensive'
}