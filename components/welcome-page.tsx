"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Heart, Mic, Brain, Star, TrendingUp } from "lucide-react"
import { EmotionTracker } from "@/lib/emotion-tracker"

interface WelcomePageProps {
  onStart: () => void
}

export default function WelcomePage({ onStart }: WelcomePageProps) {
  const [currentCycle, setCurrentCycle] = useState<{ cycleNumber: number; sessionCount: number; startDate: string } | null>(null)

  useEffect(() => {
    // 获取当前周期信息
    const cycle = EmotionTracker.getCurrentCycle()
    setCurrentCycle(cycle)
  }, [])

  const getProgressPercentage = () => {
    if (!currentCycle) return 0
    return (currentCycle.sessionCount / 7) * 100
  }

  const getMotivationText = () => {
    if (!currentCycle) return "开始你的情绪探索之旅"
    
    const remaining = 7 - currentCycle.sessionCount
    if (remaining === 7) return "开始你的情绪探索之旅"
    if (remaining === 0) return "太棒了！你已完成7次记录，可以生成成长报告了"
    if (remaining <= 2) return `就快完成了！还差${remaining}次就能生成成长报告`
    return `继续加油！还需要${remaining}次记录来完成这轮探索`
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl">
        <CardContent className="p-8 text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">此刻，我感觉想说的是......</h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              给自己5分钟，自由表达内心的感受
              <br />
              AI会帮你整理思绪，发现内在的智慧
            </p>

            {currentCycle && currentCycle.sessionCount > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-gray-800">探索进度</span>
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    第 {currentCycle.cycleNumber} 轮
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">已完成 {currentCycle.sessionCount}/7 次记录</span>
                    <span className="text-purple-600 font-medium">{Math.round(getProgressPercentage())}%</span>
                  </div>
                  <Progress value={getProgressPercentage()} className="h-2" />
                  <p className="text-sm text-purple-600 font-medium mt-2">
                    {getMotivationText()}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col items-center p-4">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center mb-3">
                <Mic className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">自由表达</h3>
              <p className="text-sm text-gray-600 text-center">语音或文字，说出你的感受</p>
            </div>

            <div className="flex flex-col items-center p-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center mb-3">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">AI分析</h3>
              <p className="text-sm text-gray-600 text-center">深度洞察你的情绪模式</p>
            </div>

            <div className="flex flex-col items-center p-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center mb-3">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">攒好处</h3>
              <p className="text-sm text-gray-600 text-center">记录成长，积累智慧</p>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={onStart}
              className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Heart className="w-5 h-5 mr-2" />
              开始倾诉
            </Button>

            <p className="text-sm text-gray-500">💡 建议在安静的环境中进行，给自己一个专注的5分钟</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
