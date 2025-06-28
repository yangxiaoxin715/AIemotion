"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Share2, RotateCcw, Heart, Sparkles } from "lucide-react"
import type { EmotionData } from "@/app/page"

interface CompletionPageProps {
  onRestart: () => void
  sessionInfo: { sessionNumber: number; shouldGenerateReport: boolean } | null
  onGenerateReport: () => Promise<void>
  emotionData?: EmotionData | null
}

export default function CompletionPage({ onRestart, sessionInfo, onGenerateReport, emotionData }: CompletionPageProps) {
  const [showConfetti, setShowConfetti] = useState(true)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "AI情绪教练",
        text: "我刚刚完成了一次深度的情绪探索，感觉很有收获！",
        url: window.location.origin,
      })
    } else {
      // 降级到复制链接
      navigator.clipboard.writeText(window.location.origin)
      alert("链接已复制到剪贴板！")
    }
  }

  const handleGenerateReportClick = async () => {
    setIsGeneratingReport(true)
    try {
      await onGenerateReport()
    } catch (error) {
      console.error("生成周报失败:", error)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const Confetti = () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-bounce"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        >
          {["🎉", "✨", "🌟", "💫", "🎊"][Math.floor(Math.random() * 5)]}
        </div>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {showConfetti && <Confetti />}

      <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl">
        <CardContent className="p-12 text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Sparkles className="w-12 h-12 text-white" />
            </div>

            <h1 className="text-4xl font-bold text-gray-800 mb-4">🌟 太棒了！</h1>

            <p className="text-xl text-gray-600 leading-relaxed mb-6">
              你刚刚完成了一次AI辅助的深度情绪探索
              <br />
              勇敢表达，智慧收获，为自己鼓掌！
            </p>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">🎯 你今天完成了：</h3>
            <div className="space-y-2 text-gray-700">
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>5分钟真诚情绪表达</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>AI全方位情绪分析</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>四维度深度心理洞察</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>个性化成长智慧总结</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span>主动攒了 {emotionData?.selectedBenefits?.length || 0} 个好处</span>
              </div>
            </div>

            {sessionInfo && (
              <div className="mt-4 pt-4 border-t border-green-200">
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <span className="text-2xl">🏆</span>
                  <span className="font-medium">
                    这是你的第 {sessionInfo.sessionNumber} 次情绪记录
                  </span>
                </div>
                {sessionInfo.shouldGenerateReport && (
                  <div className="mt-3 text-center">
                    <p className="text-sm text-purple-600 font-medium">
                      🎉 恭喜！你已完成7次记录，可以生成专属情绪成长报告了！
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 显示用户攒的好处 */}
          {emotionData?.selectedBenefits && emotionData.selectedBenefits.length > 0 && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center justify-center">
                <span className="text-2xl mr-2">💎</span>
                你今天攒的好处
              </h3>
              <div className="space-y-3">
                {emotionData.selectedBenefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-4 shadow-sm border border-yellow-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white text-sm font-bold">{index + 1}</span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">{benefit}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-yellow-700">
                  ✨ 这些好处已经攒进你的成长宝库，随时回顾！
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {sessionInfo?.shouldGenerateReport ? (
              <Button
                onClick={handleGenerateReportClick}
                disabled={isGeneratingReport}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isGeneratingReport ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    正在生成情绪成长报告...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    生成7天情绪成长报告
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={onRestart}
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                开始新一轮探索
              </Button>
            )}

            <Button
              onClick={handleShare}
              variant="outline"
              className="w-full h-12 text-lg rounded-2xl border-2 hover:bg-gray-50 bg-transparent"
            >
              <Share2 className="w-5 h-5 mr-2" />
              分享这个体验
            </Button>
            
            {sessionInfo?.shouldGenerateReport && (
              <Button
                onClick={onRestart}
                variant="outline"
                className="w-full h-12 text-lg rounded-2xl border-2 hover:bg-gray-50 bg-transparent"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                跳过报告，直接开始新探索
              </Button>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 leading-relaxed">
              💡 建议定期进行情绪探索，每周1-2次
              <br />
              持续的自我觉察是心理健康的重要基础
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center space-x-2 text-gray-400">
            <Heart className="w-4 h-4" />
            <span className="text-sm">用心制作的AI情绪教练</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
