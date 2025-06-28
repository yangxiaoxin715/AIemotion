"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Heart, Target, Brain, Lightbulb, CheckCircle, SkipForward } from "lucide-react"

interface Question {
  id: string
  icon: any
  title: string
  prompt: string
  placeholder: string
  color: string
  required: boolean
}

interface FourQuestionsData {
  feeling: string
  needs: string
  challenges: string
  insights: string
}

interface FourQuestionsPageProps {
  personalizedQuestions: {
    feeling: string
    needs: string
    challenges: string
    insights: string
  }
  onComplete: (answers: FourQuestionsData) => void
}

export default function FourQuestionsPage({ personalizedQuestions, onComplete }: FourQuestionsPageProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({
    feeling: "",
    needs: "",
    challenges: "",
    insights: "",
  })

  const [currentFocus, setCurrentFocus] = useState<string | null>(null)

  const questions: Question[] = [
    {
      id: "feeling",
      icon: Heart,
      title: "1️⃣ 我的主要感受是什么？",
      prompt: personalizedQuestions.feeling,
      placeholder: "试着用几个词描述你现在最主要的感受...",
      color: "from-pink-400 to-red-400",
      required: true,
    },
    {
      id: "needs",
      icon: Target,
      title: "2️⃣ 我的未被满足的需要可能是什么？",
      prompt: personalizedQuestions.needs,
      placeholder: "在这些感受背后，你可能需要什么？理解、支持、休息、认可...？",
      color: "from-blue-400 to-cyan-400",
      required: true,
    },
    {
      id: "challenges",
      icon: Brain,
      title: "3️⃣ 我现在的关键挑战可能是什么？",
      prompt: personalizedQuestions.challenges,
      placeholder: "什么是你现在最主要的困难或挑战？",
      color: "from-purple-400 to-indigo-400",
      required: false,
    },
    {
      id: "insights",
      icon: Lightbulb,
      title: "4️⃣ 有没有什么我没有注意到的重点？",
      prompt: personalizedQuestions.insights,
      placeholder: "重新看看前面的分析，有什么你之前没意识到的地方吗？",
      color: "from-green-400 to-emerald-400",
      required: false,
    },
  ]

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const getWordCount = (text: string) => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length
  }

  const getCompletedCount = () => {
    return Object.values(answers).filter((answer) => answer.trim().length > 0).length
  }

  const getRequiredCompletedCount = () => {
    return questions.filter((q) => q.required).filter((q) => answers[q.id]?.trim().length > 0).length
  }

  const canComplete = () => {
    const requiredQuestions = questions.filter((q) => q.required)
    return requiredQuestions.every((q) => answers[q.id]?.trim().length > 0)
  }

  const handleComplete = () => {
    if (!canComplete()) {
      alert("请至少完成必填问题")
      return
    }
    onComplete({
      feeling: answers.feeling || "",
      needs: answers.needs || "",
      challenges: answers.challenges || "",
      insights: answers.insights || ""
    })
  }

  const handleSkip = (questionId: string) => {
    // 跳过逻辑，可以记录跳过的问题
    console.log(`跳过问题: ${questionId}`)
  }

  const progressPercentage = (getCompletedCount() / questions.length) * 100

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto">
        {/* 顶部标题和进度 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">💭 四个问题帮你深入</h1>
          <p className="text-xl text-gray-600 mb-6">基于你的表达，这些问题可能帮你看得更清楚</p>

          {/* 进度指示 */}
          <div className="max-w-md mx-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">完成进度</span>
              <span className="text-sm font-medium text-gray-800">
                {getCompletedCount()}/{questions.length}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-xs text-gray-500 mt-2">
              必填问题: {getRequiredCompletedCount()}/{questions.filter((q) => q.required).length}
            </p>
          </div>
        </div>

        {/* 问题卡片 */}
        <div className="space-y-6 mb-8">
          {questions.map((question) => {
            const Icon = question.icon
            const isCompleted = answers[question.id]?.trim().length > 0
            const wordCount = getWordCount(answers[question.id] || "")
            const isFocused = currentFocus === question.id

            return (
              <Card
                key={question.id}
                className={`bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl transition-all duration-300 ${
                  isFocused ? "ring-2 ring-blue-400 shadow-xl" : ""
                } ${isCompleted ? "border-green-200" : ""}`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 bg-gradient-to-r ${question.color} rounded-full flex items-center justify-center`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-800 flex items-center space-x-2">
                          <span>{question.title}</span>
                          {question.required && (
                            <Badge variant="secondary" className="text-xs">
                              必填
                            </Badge>
                          )}
                          {isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
                        </CardTitle>
                      </div>
                    </div>

                    {!question.required && !isCompleted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSkip(question.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <SkipForward className="w-4 h-4 mr-1" />
                        跳过
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* AI个性化提示 */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                    <p className="text-gray-700 leading-relaxed">💡 {question.prompt}</p>
                  </div>

                  {/* 回答输入框 */}
                  <div className="space-y-2">
                    <Textarea
                      value={answers[question.id] || ""}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      onFocus={() => setCurrentFocus(question.id)}
                      onBlur={() => setCurrentFocus(null)}
                      placeholder={question.placeholder}
                      className="min-h-[120px] text-base leading-relaxed border-2 focus:border-blue-400 rounded-xl resize-none"
                    />

                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>建议 50-200 字</span>
                      <span className={wordCount > 200 ? "text-orange-500" : wordCount > 50 ? "text-green-500" : ""}>
                        {wordCount} 字
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* 底部操作按钮 */}
        <div className="text-center">
          <Button
            onClick={handleComplete}
            disabled={!canComplete()}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-12 py-4 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {canComplete()
              ? "继续下一步 →"
              : `还需完成 ${questions.filter((q) => q.required).length - getRequiredCompletedCount()} 个必填问题`}
          </Button>

          <p className="text-sm text-gray-500 mt-4">💡 深入思考需要时间，不用急于完成每个问题</p>
        </div>
      </div>
    </div>
  )
}
