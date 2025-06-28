// 情绪记录管理器
import type { EmotionData, EmotionRecord, SessionInfo, WeeklyReport } from '@/types/emotion'

// 类型定义已移至 @/types/emotion

export class EmotionTracker {
  private static STORAGE_KEY = 'emotion_records'
  private static CURRENT_CYCLE_KEY = 'current_emotion_cycle'

  // 获取所有情绪记录
  static getAllRecords(): EmotionRecord[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('获取情绪记录失败:', error)
      return []
    }
  }

  // 获取当前周期信息
  static getCurrentCycle(): { cycleNumber: number; sessionCount: number; startDate: string } {
    if (typeof window === 'undefined') return { cycleNumber: 1, sessionCount: 0, startDate: new Date().toISOString() }
    
    try {
      const stored = localStorage.getItem(this.CURRENT_CYCLE_KEY)
      return stored ? JSON.parse(stored) : { cycleNumber: 1, sessionCount: 0, startDate: new Date().toISOString() }
    } catch (error) {
      console.error('获取当前周期失败:', error)
      return { cycleNumber: 1, sessionCount: 0, startDate: new Date().toISOString() }
    }
  }

  // 保存情绪记录
  static saveRecord(emotionData: EmotionData): SessionInfo {
    if (typeof window === 'undefined') return { sessionNumber: 1, shouldGenerateReport: false }

    try {
      const records = this.getAllRecords()
      let currentCycle = this.getCurrentCycle()
      
      // 如果当前周期已经完成了7次，自动开始新周期
      if (currentCycle.sessionCount >= 7) {
        console.log(`检测到周期${currentCycle.cycleNumber}已完成${currentCycle.sessionCount}次记录，自动开始新周期`)
        currentCycle = {
          cycleNumber: currentCycle.cycleNumber + 1,
          sessionCount: 0,
          startDate: new Date().toISOString()
        }
        localStorage.setItem(this.CURRENT_CYCLE_KEY, JSON.stringify(currentCycle))
        console.log(`新周期${currentCycle.cycleNumber}已开始`)
      }
      
      const newSessionNumber = currentCycle.sessionCount + 1
      const newRecord: EmotionRecord = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        emotionData,
        sessionNumber: newSessionNumber,
        cycleNumber: currentCycle.cycleNumber
      }

      // 保存记录
      records.push(newRecord)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records))

      // 更新周期信息
      const updatedCycle = {
        ...currentCycle,
        sessionCount: newSessionNumber
      }
      localStorage.setItem(this.CURRENT_CYCLE_KEY, JSON.stringify(updatedCycle))

      // 检查是否需要生成报告（第7次）
      const shouldGenerateReport = newSessionNumber === 7

      console.log(`记录已保存：周期${currentCycle.cycleNumber} - 第${newSessionNumber}次记录${shouldGenerateReport ? ' (将生成报告)' : ''}`)

      return { 
        sessionNumber: newSessionNumber, 
        shouldGenerateReport,
        cycleNumber: currentCycle.cycleNumber,
        startTime: new Date().toISOString()
      }
    } catch (error) {
      console.error('保存情绪记录失败:', error)
      return { 
        sessionNumber: 1, 
        shouldGenerateReport: false,
        cycleNumber: 1,
        startTime: new Date().toISOString()
      }
    }
  }

  // 获取最近7次记录（当前周期的记录）
  static getRecentSevenRecords(): EmotionRecord[] {
    const allRecords = this.getAllRecords()
    const currentCycle = this.getCurrentCycle()
    
    // 向后兼容：为没有cycleNumber的旧记录设置默认值
    const recordsWithCycle = allRecords.map(record => ({
      ...record,
      cycleNumber: record.cycleNumber || 1 // 如果没有cycleNumber，默认为第1周期
    }))
    
    // 如果当前周期还没有完成7次，返回当前周期的所有记录
    if (currentCycle.sessionCount < 7) {
      return recordsWithCycle.filter(record => 
        record.cycleNumber === currentCycle.cycleNumber
      )
    }
    
    // 如果当前周期已完成7次，返回最近完成的7次记录
    // 按周期分组记录
    const completedCycles = recordsWithCycle.reduce((cycles, record) => {
      if (!cycles[record.cycleNumber]) {
        cycles[record.cycleNumber] = []
      }
      cycles[record.cycleNumber].push(record)
      return cycles
    }, {} as { [key: number]: EmotionRecord[] })
    
    // 找到最近的完整7次记录周期
    const cycleNumbers = Object.keys(completedCycles).map(Number).sort((a, b) => b - a)
    
    for (const cycleNum of cycleNumbers) {
      const cycleRecords = completedCycles[cycleNum]
      if (cycleRecords.length >= 7) {
        // 按时间排序，返回该周期的前7次记录
        return cycleRecords
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .slice(0, 7)
      }
    }
    
    // 如果没有找到完整的周期，返回最后7条记录
    return recordsWithCycle.slice(-7)
  }

  // 开始新周期
  static startNewCycle(): void {
    if (typeof window === 'undefined') return

    try {
      const currentCycle = this.getCurrentCycle()
      const newCycle = {
        cycleNumber: currentCycle.cycleNumber + 1,
        sessionCount: 0,
        startDate: new Date().toISOString()
      }
      localStorage.setItem(this.CURRENT_CYCLE_KEY, JSON.stringify(newCycle))
    } catch (error) {
      console.error('开始新周期失败:', error)
    }
  }

  // 分析情绪趋势
  static analyzeEmotionTrends(records: EmotionRecord[]): Array<{
    session: number
    dominantEmotion: string
    intensity: number
    date: string
  }> {
    return records.map((record, index) => {
      // 找出最主要的情绪（出现频率最高的情绪词）
      const dominantEmotion = record.emotionData.emotionWords.length > 0 
        ? record.emotionData.emotionWords[0].word 
        : '平静'
      
      // 计算情绪强度（基于情绪词的总数）
      const intensity = record.emotionData.emotionWords.reduce((sum, item) => sum + item.count, 0)
      
      return {
        session: index + 1, // 使用索引+1作为session编号，确保是1-7的顺序
        dominantEmotion,
        intensity: Math.min(intensity * 10, 100), // 标准化到0-100
        date: new Date(record.timestamp).toLocaleDateString('zh-CN')
      }
    })
  }

  // 清理数据（可选，用于重置）
  static clearAllData(): void {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem(this.STORAGE_KEY)
    localStorage.removeItem(this.CURRENT_CYCLE_KEY)
  }
}
