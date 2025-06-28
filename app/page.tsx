"use client"

import { useState, useEffect } from "react"
import WelcomePage from "@/components/welcome-page"
import VoiceExpressionPage from "@/components/voice-expression-page"
import AnalysisPage from "@/components/analysis-page"
import CompletionPage from "@/components/completion-page"
import WeeklyReportPage from "@/components/weekly-report-page"
import { EmotionTracker } from "@/lib/emotion-tracker"
import type { WeeklyReport } from "@/lib/emotion-tracker"

export type AppStep = "welcome" | "expression" | "analysis" | "completion" | "weekly-report"

export interface EmotionData {
  transcript: string
  emotionWords: { word: string; count: number }[]
  insights: string[]
  fourQuestionsAnalysis: {
    feeling: string
    needs: string
    challenges: string
    insights: string
  }
  growthSummary: {
    discovered: string
    reminder: string
  }
  suggestedBenefits: string[] // AI建议的好处选项
  selectedBenefits: string[]  // 用户选择的好处
}



export default function EmotionCoachApp() {
  const [currentStep, setCurrentStep] = useState<AppStep>("welcome")
  const [emotionData, setEmotionData] = useState<EmotionData | null>(null)
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null)
  const [sessionInfo, setSessionInfo] = useState<{ sessionNumber: number; shouldGenerateReport: boolean } | null>(null)

  // 保存数据到本地存储
  useEffect(() => {
    if (emotionData) {
      localStorage.setItem("emotionData", JSON.stringify(emotionData))
    }
  }, [emotionData])

  const handleStepChange = (step: AppStep) => {
    setCurrentStep(step)
  }

  const handleEmotionAnalysis = (data: EmotionData, sessionInfo: { sessionNumber: number; shouldGenerateReport: boolean }) => {
    setEmotionData(data)
    setSessionInfo(sessionInfo)
    setCurrentStep("analysis")
  }

  const handleAnalysisComplete = (selectedBenefits: string[]) => {
    // 更新emotionData，保存用户选择的好处
    if (emotionData) {
      const updatedData = {
        ...emotionData,
        selectedBenefits
      }
      setEmotionData(updatedData)
    }
    // 跳转到完成页面
    setCurrentStep("completion")
  }

  const handleGenerateWeeklyReport = async () => {
    if (!sessionInfo?.shouldGenerateReport) return

    try {
      const recentRecords = EmotionTracker.getRecentSevenRecords()
      
      const response = await fetch('/api/generate-weekly-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ records: recentRecords }),
      })

      if (!response.ok) {
        throw new Error('生成周报失败')
      }

      const report = await response.json()
      setWeeklyReport(report)
      setCurrentStep("weekly-report")
    } catch (error) {
      console.error('生成周报失败:', error)
      alert('生成情绪周报失败，请稍后重试')
    }
  }

  const handleStartNewCycle = () => {
    EmotionTracker.startNewCycle()
    setCurrentStep("welcome")
    setEmotionData(null)
    setWeeklyReport(null)
    setSessionInfo(null)
    localStorage.removeItem("emotionData")
  }

  const handleViewHistory = () => {
    // 这里可以实现查看历史记录的功能
    alert('历史记录功能开发中...')
  }

  const handleRestart = () => {
    setCurrentStep("welcome")
    setEmotionData(null)
    localStorage.removeItem("emotionData")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-purple-600">
      {currentStep === "welcome" && <WelcomePage onStart={() => handleStepChange("expression")} />}

      {currentStep === "expression" && <VoiceExpressionPage onComplete={handleEmotionAnalysis} />}

      {currentStep === "analysis" && emotionData && (
        <AnalysisPage emotionData={emotionData} onComplete={handleAnalysisComplete} />
      )}



      {currentStep === "completion" && (
        <CompletionPage 
          onRestart={handleRestart} 
          sessionInfo={sessionInfo}
          onGenerateReport={handleGenerateWeeklyReport}
          emotionData={emotionData}
        />
      )}

      {currentStep === "weekly-report" && weeklyReport && (
        <WeeklyReportPage 
          report={weeklyReport}
          onStartNewCycle={handleStartNewCycle}
          onViewHistory={handleViewHistory}
        />
      )}
    </div>
  )
}
