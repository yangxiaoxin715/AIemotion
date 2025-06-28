"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, MicOff, RotateCcw, CheckCircle, AlertCircle } from "lucide-react"
import AudioWaveform from "@/components/audio-waveform"
import VoiceTranscriptDisplay from "@/components/voice-transcript-display"
import type { EmotionData } from "@/app/page"
import { EmotionTracker } from "@/lib/emotion-tracker"

interface VoiceExpressionPageProps {
  onComplete: (data: EmotionData, sessionInfo: { sessionNumber: number; shouldGenerateReport: boolean }) => void
}

export default function VoiceExpressionPage({ onComplete }: VoiceExpressionPageProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [timeLeft, setTimeLeft] = useState(300) // 5分钟 = 300秒
  const [isSupported, setIsSupported] = useState(true)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const recognitionRef = useRef<any>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    // 检查浏览器支持
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setIsSupported(false)
    }

    return () => {
      cleanup()
    }
  }, [])

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
    }
  }

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const startRecording = async () => {
    if (!isSupported) {
      alert("您的浏览器不支持语音识别功能，请使用现代浏览器")
      return
    }

    try {
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // 设置语音识别
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()

      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "zh-CN"

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("语音识别错误:", event.error)
        if (event.error === "not-allowed") {
          setPermissionDenied(true)
          setIsRecording(false)
        }
      }

      recognitionRef.current.onend = () => {
        if (isRecording && !isPaused) {
          // 如果还在录音状态但识别结束了，重新启动
          setTimeout(() => {
            if (recognitionRef.current && isRecording) {
              recognitionRef.current.start()
            }
          }, 100)
        }
      }

      // 设置音频可视化
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      analyserRef.current.fftSize = 256
      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(average / 255)
          requestAnimationFrame(updateAudioLevel)
        }
      }

      recognitionRef.current.start()
      setIsRecording(true)
      setIsPaused(false)
      setPermissionDenied(false)
      startTimer()
      updateAudioLevel()
    } catch (error) {
      console.error("启动录音失败:", error)
      setPermissionDenied(true)
      alert("无法访问麦克风，请检查权限设置")
    }
  }

  const pauseRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop()
      setIsPaused(true)
      stopTimer()
    }
  }

  const resumeRecording = () => {
    if (isPaused && recognitionRef.current) {
      recognitionRef.current.start()
      setIsPaused(false)
      startTimer()
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
    setIsPaused(false)
    stopTimer()
    setAudioLevel(0)
  }

  const resetRecording = () => {
    stopRecording()
    setTranscript("")
    setTimeLeft(300)
  }

  const handleComplete = async () => {
    if (!transcript.trim()) {
      alert("请先表达一些内容再继续")
      return
    }

    stopRecording()
    setIsAnalyzing(true)

    try {
      // 获取AI分析结果
      const analysisResult = await analyzeEmotion(transcript)
      
      // 保存情绪记录并获取会话信息
      const sessionInfo = EmotionTracker.saveRecord(analysisResult)
      
      // 传递分析结果和会话信息
      onComplete(analysisResult, sessionInfo)
    } catch (error) {
      console.error("分析失败:", error)
      setIsAnalyzing(false)
    }
  }

  const analyzeEmotion = async (text: string): Promise<EmotionData> => {
    try {
      // 调用真实的AI API
      const response = await fetch('/api/analyze-emotion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '分析请求失败')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('AI分析错误:', error)
      
      // 显示错误提示给用户
      let errorMessage = "AI分析暂时不可用，已为您提供基础分析结果"
      
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('504')) {
          errorMessage = "网络连接超时，已为您提供基础分析结果"
        } else if (error.message.includes('401')) {
          errorMessage = "API配置问题，已为您提供基础分析结果"
        }
      }
      
      // 显示友好的错误提示
      alert(`⚠️ ${errorMessage}\n\n💡 建议：\n• 检查网络连接\n• 稍后重试\n• 或联系技术支持`)
      
      // 如果API调用失败，使用备用分析
      return {
        transcript: text,
        emotionWords: [
          { word: "表达", count: 1 },
          { word: "感受", count: 1 }
        ],
        insights: [
          "感谢你的真诚分享",
          "每一次表达都是勇敢的开始",
          "你的感受值得被认真对待"
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
        }
      }
    }
  }

  const extractEmotionWords = (text: string) => {
    const emotions = [
      "焦虑",
      "担心",
      "紧张",
      "压力",
      "累",
      "疲惫",
      "开心",
      "兴奋",
      "满足",
      "失望",
      "沮丧",
      "愤怒",
      "害怕",
      "孤独",
      "困惑",
      "无助",
      "烦躁",
      "放松",
    ]
    const wordCounts: { [key: string]: number } = {}

    emotions.forEach((emotion) => {
      const regex = new RegExp(emotion, "g")
      const matches = text.match(regex)
      if (matches) {
        wordCounts[emotion] = matches.length
      }
    })

    return Object.entries(wordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }

  const generateInsights = (text: string) => {
    const insights = [
      "你在表达中提到了多个关于压力的词汇，这可能反映了你当前面临的挑战",
      "从你的语言中能感受到你很在意结果，这显示了你的责任心",
      "你提到的情绪词汇显示了内心的复杂感受，这是很正常的",
      "尽管有困难，你仍在寻找表达的方式，这显示了你的勇气",
    ]

    // 根据文本内容选择相关的洞察
    return insights.slice(0, 3 + Math.floor(Math.random() * 2))
  }

  const generatePersonalizedQuestions = (text: string) => {
    // 基础四问
    const questions = {
      feeling: "基于你的表达，你现在主要的感受是什么？",
      needs: "在这些感受背后，你可能需要什么？",
      challenges: "当前最主要的挑战是什么？",
      insights: "有什么是你之前没有注意到的吗？",
    }

    // 个性化调整
    if (text.includes("工作") || text.includes("职场")) {
      questions.feeling = "面对工作压力，你的核心感受是什么？"
      questions.needs = "在职场中，你希望获得什么样的支持？"
    }

    if (text.includes("孩子") || text.includes("家庭")) {
      questions.feeling = "作为家长，你现在的主要感受是什么？"
      questions.needs = "在育儿过程中，你可能需要什么样的支持？"
    }

    return questions
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getProgressPercentage = () => {
    return ((300 - timeLeft) / 300) * 100
  }

  if (isAnalyzing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-200 via-pink-200 to-purple-200">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-spin">
              <div className="w-8 h-8 bg-white rounded-full"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">AI正在分析中...</h2>
            <p className="text-gray-600">正在深度理解你的表达内容</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-orange-200 via-pink-200 to-purple-200">
      <div className="max-w-4xl mx-auto">
        {/* 顶部标题区域 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">🎙️ 此刻，我感觉想说的是......</h1>
          <p className="text-xl text-gray-600">想到什么说什么，不用组织语言</p>
        </div>

        {/* 时间显示 */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-3xl font-bold text-orange-600">⏰ {formatTime(timeLeft)}</div>

          {permissionDenied && (
            <div className="flex items-center text-red-600">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="text-sm">需要麦克风权限</span>
            </div>
          )}
        </div>

        {/* 中央录音区域 */}
        <Card className="mb-8 bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="relative inline-block">
                {/* 录音按钮 */}
                <div className="relative">
                  <Button
                    onClick={isRecording ? (isPaused ? resumeRecording : pauseRecording) : startRecording}
                    disabled={!isSupported || permissionDenied}
                    className={`w-32 h-32 rounded-full text-white font-semibold text-lg shadow-2xl transition-all duration-300 ${
                      isRecording && !isPaused
                        ? "bg-gradient-to-r from-red-500 to-red-600 animate-pulse scale-110"
                        : isPaused
                          ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:scale-105"
                          : "bg-gradient-to-r from-gray-400 to-gray-500 hover:from-blue-500 hover:to-purple-500 hover:scale-105"
                    }`}
                  >
                    {isRecording && !isPaused ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                  </Button>

                  {/* 圆形进度条 */}
                  {isRecording && (
                    <svg className="absolute inset-0 w-32 h-32 -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="60"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-gray-200"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="60"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 60}`}
                        strokeDashoffset={`${2 * Math.PI * 60 * (1 - getProgressPercentage() / 100)}`}
                        className="text-red-500 transition-all duration-1000"
                      />
                    </svg>
                  )}
                </div>

                {/* 波形动画 */}
                {isRecording && (
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                    <AudioWaveform isRecording={isRecording && !isPaused} audioLevel={audioLevel} />
                  </div>
                )}
              </div>

              <p className="mt-12 text-lg text-gray-600">
                {isRecording && !isPaused
                  ? "正在录音中，点击暂停"
                  : isPaused
                    ? "录音已暂停，点击继续"
                    : isSupported
                      ? "点击开始录音"
                      : "浏览器不支持语音功能"}
              </p>
            </div>

            {/* 语音转文字显示 */}
            <VoiceTranscriptDisplay
              transcript={transcript}
              isListening={isRecording && !isPaused}
              onTranscriptChange={setTranscript}
              isEditable={!isRecording}
            />
          </CardContent>
        </Card>

        {/* 底部控制区域 */}
        <div className="flex justify-center space-x-4">
          {transcript && (
            <Button onClick={resetRecording} variant="outline" className="bg-white/80 hover:bg-white rounded-xl px-6">
              <RotateCcw className="w-4 h-4 mr-2" />
              重新录制
            </Button>
          )}

          <Button
            onClick={handleComplete}
            disabled={!transcript.trim()}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl px-8 py-3 text-lg shadow-lg"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            完成表达
          </Button>
        </div>
      </div>
    </div>
  )
}
