"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { EmotionData } from "@/types/emotion"
import { useState } from "react"
import {} from "lucide-react"
import EmotionChart from "./emotion-chart"

interface AnalysisPageProps {
  emotionData: EmotionData
  onComplete: (selectedBenefits: string[]) => void
}

export default function AnalysisPage({ emotionData, onComplete }: AnalysisPageProps) {
  const [selectedBenefits, setSelectedBenefits] = useState<string[]>([])
  const [showBenefitSelection, setShowBenefitSelection] = useState(false)
  // const [answers, setAnswers] = useState({
  //   feeling: "",
  //   needs: "",
  //   challenges: "",
  //   insights: "",
  // })

  // const handleAnswerChange = (key: keyof typeof answers, value: string) => {
  //   setAnswers((prev) => ({ ...prev, [key]: value }))
  // }

  const toggleBenefit = (benefit: string) => {
    setSelectedBenefits(prev => 
      prev.includes(benefit) 
        ? prev.filter(b => b !== benefit)
        : [...prev, benefit]
    )
  }

  const handleStartBenefitSelection = () => {
    setShowBenefitSelection(true)
  }

  const handleComplete = () => {
    onComplete(selectedBenefits)
  }

  // const isComplete = Object.values(answers).every((answer) => answer.trim().length > 0)

  // const questions = [
  //   {
  //     id: "feeling" as const,
  //     icon: Heart,
  //     title: "1️⃣ 我的主要感受是什么？",
  //     prompt: emotionData.questions.feeling,
  //     placeholder: "描述你现在最主要的情绪和感受...",
  //     color: "from-pink-400 to-red-400",
  //   },
  //   {
  //     id: "needs" as const,
  //     icon: Target,
  //     title: "2️⃣ 我的未被满足的需要可能是什么？",
  //     prompt: emotionData.questions.needs,
  //     placeholder: "思考一下你内心深处真正需要的是什么...",
  //     color: "from-blue-400 to-cyan-400",
  //   },
  //   {
  //     id: "challenges" as const,
  //     icon: Brain,
  //     title: "3️⃣ 我现在的关键挑战可能是什么？",
  //     prompt: emotionData.questions.challenges,
  //     placeholder: "识别当前面临的主要困难或障碍...",
  //     color: "from-purple-400 to-indigo-400",
  //   },
  //   {
  //     id: "insights" as const,
  //     icon: Lightbulb,
  //     title: "4️⃣ 有没有什么我没有注意到的重点？",
  //     prompt: emotionData.questions.insights,
  //     placeholder: "从新的角度看待这个情况...",
  //     color: "from-green-400 to-emerald-400",
  //   },
  // ]

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🪞 AI为你深度解读</h1>
          <p className="text-xl text-white/90">基于你的表达，AI完成了全面的情感分析和成长洞察</p>
        </div>

        {/* 情绪词统计 */}
        <Card className="mb-8 bg-white/95 backdrop-blur-sm rounded-3xl">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-800">📊 情绪词汇分析</CardTitle>
          </CardHeader>
          <CardContent>
            {emotionData.emotionWords.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {emotionData.emotionWords.map((item, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-lg py-2 px-4 bg-gradient-to-r from-orange-100 to-pink-100 text-orange-800 border-orange-200"
                  >
                    {item.word} × {item.count}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">未检测到明显的情绪词汇</p>
            )}
          </CardContent>
        </Card>

        {/* 情绪强度图表 */}
        <Card className="mb-8 bg-white/95 backdrop-blur-sm rounded-3xl">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-800">📈 情绪强度图表</CardTitle>
          </CardHeader>
          <CardContent>
            <EmotionChart emotionData={emotionData} />
          </CardContent>
        </Card>

        {/* AI洞察 */}
        <Card className="mb-8 bg-white/95 backdrop-blur-sm rounded-3xl">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-800">💡 AI洞察</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {emotionData.insights.map((insight, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white font-bold text-sm">{index + 1}</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI深度分析 - 四个维度 */}
        <Card className="mb-8 bg-white/95 backdrop-blur-sm rounded-3xl">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-800">🧠 AI深度分析</CardTitle>
            <p className="text-gray-600">基于你的表达，AI从四个维度为你提供深度洞察</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-red-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">💝</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">主要感受</h3>
                </div>
                <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-4">
                  <p className="text-gray-700 leading-relaxed">{emotionData.fourQuestionsAnalysis.feeling}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">🎯</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">内在需求</h3>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-4">
                  <p className="text-gray-700 leading-relaxed">{emotionData.fourQuestionsAnalysis.needs}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">⚡</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">关键挑战</h3>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-4">
                  <p className="text-gray-700 leading-relaxed">{emotionData.fourQuestionsAnalysis.challenges}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">✨</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">新的发现</h3>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4">
                  <p className="text-gray-700 leading-relaxed">{emotionData.fourQuestionsAnalysis.insights}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 成长总结 */}
        <Card className="mb-8 bg-white/95 backdrop-blur-sm rounded-3xl">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-800">🌱 成长洞察</CardTitle>
            <p className="text-gray-600">AI为你总结的成长收获和智慧提醒</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">👁️</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">今天我看见了</h3>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6">
                  <p className="text-gray-700 text-lg leading-relaxed">{emotionData.growthSummary.discovered}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">💌</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">想提醒未来的我</h3>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
                  <p className="text-gray-700 text-lg leading-relaxed">{emotionData.growthSummary.reminder}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 攒好处选择区域 */}
        {!showBenefitSelection ? (
          <div className="text-center mb-8">
            <Button
              onClick={handleStartBenefitSelection}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-12 py-4 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              💎 开始攒好处
            </Button>
            <p className="text-white/80 mt-2">AI为你发现了一些好处，来看看哪些值得攒起来！</p>
          </div>
        ) : (
          <Card className="mb-8 bg-white/95 backdrop-blur-sm rounded-3xl">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-800">💎 攒好处时间</CardTitle>
              <p className="text-gray-600">AI为你发现了这些好处，点击选择你认为值得攒起来的：</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {emotionData.suggestedBenefits?.map((benefit, index) => (
                  <div
                    key={index}
                    onClick={() => toggleBenefit(benefit)}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all duration-300 ${
                      selectedBenefits.includes(benefit)
                        ? "border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-md"
                        : "border-gray-200 bg-white hover:border-yellow-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        selectedBenefits.includes(benefit)
                          ? "border-yellow-500 bg-yellow-500"
                          : "border-gray-300"
                      }`}>
                        {selectedBenefits.includes(benefit) && (
                          <span className="text-white text-sm">✓</span>
                        )}
                      </div>
                      <p className="text-gray-700 leading-relaxed flex-1">{benefit}</p>
                      <div className={`text-2xl ${
                        selectedBenefits.includes(benefit) ? "opacity-100" : "opacity-40"
                      }`}>
                        💎
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedBenefits.length > 0 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl">
                  <p className="text-gray-700 font-medium">
                    🎉 太棒了！你已经选择了 <span className="text-yellow-700 font-bold">{selectedBenefits.length}</span> 个好处攒起来
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 完成按钮 */}
        {showBenefitSelection && (
          <div className="text-center">
            <Button
              onClick={handleComplete}
              disabled={selectedBenefits.length === 0}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-12 py-4 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedBenefits.length === 0 ? "请先选择要攒的好处" : `🎉 攒好了${selectedBenefits.length}个好处，查看完整报告`}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
