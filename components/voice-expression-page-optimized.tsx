"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, MicOff, RotateCcw, CheckCircle, AlertCircle, X, Smartphone, Monitor } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import AudioWaveform from "@/components/audio-waveform"
import VoiceTranscriptDisplay from "@/components/voice-transcript-display"
import { ComponentErrorBoundary } from "@/components/error-boundary"
import type { EmotionData } from "@/types/emotion"
import { EmotionTracker } from "@/lib/emotion-tracker"
import { useAudioRecording } from "@/hooks/use-audio-recording"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"
import { sanitizeText } from "@/lib/validation"

interface VoiceExpressionPageProps {
  onComplete: (data: EmotionData, sessionInfo: { sessionNumber: number; shouldGenerateReport: boolean }) => void
}

// 设备检测工具函数
const getDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return { isMobile: false, isIOS: false, isAndroid: false, isHTTPS: false }
  }

  const userAgent = navigator.userAgent
  return {
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
    isIOS: /iPad|iPhone|iPod/.test(userAgent),
    isAndroid: /Android/.test(userAgent),
    isHTTPS: location.protocol === 'https:' || location.hostname === 'localhost'
  }
}

export default function VoiceExpressionPageOptimized({ onComplete }: VoiceExpressionPageProps) {
  const { toast } = useToast()
  const [timeLeft, setTimeLeft] = useState(300) // 5分钟
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [deviceInfo] = useState(getDeviceInfo)
  const [showMobileGuide, setShowMobileGuide] = useState(false)

  // 使用新的音频录制hook
  const [audioState, audioActions] = useAudioRecording({
    deviceInfo,
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "录音错误",
        description: error
      })
    }
  })

  // 使用新的语音识别hook
  const [speechState, speechActions] = useSpeechRecognition({
    deviceInfo,
    onError: (error) => {
      toast({
        variant: "destructive", 
        title: "语音识别错误",
        description: error
      })
    },
    onResult: (result) => {
      console.log('语音识别结果:', result)
    }
  })

  // 定时器管理
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (audioState.isRecording && !audioState.isPaused) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [audioState.isRecording, audioState.isPaused])

  // 设备兼容性检查
  useEffect(() => {
    if (!deviceInfo.isHTTPS) {
      toast({
        variant: "destructive",
        title: "需要安全连接",
        description: "录音功能需要HTTPS连接，请使用https://开头的网址访问"
      })
      return
    }

    if (deviceInfo.isIOS) {
      setShowMobileGuide(true)
      toast({
        variant: "destructive",
        title: "浏览器兼容性",
        description: "iOS Safari对语音识别支持有限，建议使用Chrome浏览器"
      })
    }
  }, [deviceInfo, toast])

  // 开始录音
  const handleStartRecording = useCallback(async () => {
    try {
      // 同时启动音频录制和语音识别
      await audioActions.startRecording()
      speechActions.startListening()
      
      toast({
        title: "录音已开始",
        description: "请开始表达你的感受"
      })
    } catch (error) {
      console.error('启动录音失败:', error)
    }
  }, [audioActions, speechActions, toast])

  // 暂停录音
  const handlePauseRecording = useCallback(() => {
    audioActions.pauseRecording()
    speechActions.stopListening()
    
    toast({
      title: "录音已暂停",
      description: "点击继续恢复录音"
    })
  }, [audioActions, speechActions, toast])

  // 恢复录音
  const handleResumeRecording = useCallback(() => {
    audioActions.resumeRecording()
    speechActions.startListening()
    
    toast({
      title: "录音已恢复",
      description: "继续表达你的感受"
    })
  }, [audioActions, speechActions, toast])

  // 停止录音
  const handleStopRecording = useCallback(() => {
    audioActions.stopRecording()
    speechActions.stopListening()
  }, [audioActions, speechActions])

  // 重置录音
  const handleResetRecording = useCallback(() => {
    handleStopRecording()
    speechActions.resetTranscript()
    setTimeLeft(300)
    
    toast({
      title: "已重置",
      description: "可以重新开始录音"
    })
  }, [handleStopRecording, speechActions, toast])

  // 完成表达
  const handleComplete = useCallback(async () => {
    const transcript = speechState.transcript.trim()
    
    if (!transcript) {
      toast({
        variant: "destructive",
        title: "内容为空",
        description: "请先表达一些内容再继续"
      })
      return
    }

    handleStopRecording()
    setIsAnalyzing(true)

    try {
      const analysisResult = await analyzeEmotion(transcript)
      const sessionInfo = EmotionTracker.saveRecord(analysisResult)
      
      toast({
        title: "分析完成",
        description: "正在生成情绪分析结果"
      })
      
      onComplete(analysisResult, sessionInfo)
    } catch (error) {
      console.error("分析失败:", error)
      setIsAnalyzing(false)
      
      toast({
        variant: "destructive",
        title: "分析失败",
        description: "请重试或检查网络连接"
      })
    }
  }, [speechState.transcript, handleStopRecording, onComplete, toast])

  // AI情绪分析
  const analyzeEmotion = async (text: string): Promise<EmotionData> => {
    const sanitizedText = sanitizeText(text)
    
    try {
      const response = await fetch('/api/analyze-emotion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sanitizedText }),
        signal: AbortSignal.timeout(60000)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '请求失败' }))
        throw new Error(errorData.error || '分析请求失败')
      }

      return await response.json()
    } catch (error) {
      console.error('AI分析错误:', error)
      
      // 显示友好错误信息
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          toast({
            variant: "destructive",
            title: "网络超时",
            description: "已为您提供基础分析结果"
          })
        } else {
          toast({
            variant: "destructive", 
            title: "AI服务暂时不可用",
            description: "已为您提供基础分析结果"
          })
        }
      }

      // 返回基础分析结果
      return {
        transcript: sanitizedText,
        emotionWords: [
          { word: "表达", count: 1 },
          { word: "思考", count: 1 },
          { word: "感受", count: 1 }
        ],
        insights: [
          "感谢你的真诚分享",
          "每一次表达都是勇敢的开始", 
          "你的感受值得被认真对待"
        ],
        fourQuestionsAnalysis: {
          feeling: "从你的表达中，我感受到你内心的真实情绪",
          needs: "你可能需要被理解和接纳",
          challenges: "主要挑战是如何更好地表达自己",
          insights: "你已经迈出了重要的一步"
        },
        growthSummary: {
          discovered: "你发现了自己有勇气面对内心感受",
          reminder: "记住，每一次表达都是成长"
        },
        suggestedBenefits: [
          "你有勇气面对真实感受",
          "你正在主动寻求自我理解",
          "你愿意关注内心世界",
          "你有自我觉察的能力"
        ],
        selectedBenefits: []
      }
    }
  }

  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // 获取进度百分比
  const getProgressPercentage = () => {
    return ((300 - timeLeft) / 300) * 100
  }

  // 分析中的加载界面
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
            {deviceInfo.isMobile && (
              <p className="text-sm text-gray-500 mt-2">移动端可能需要更长时间，请耐心等待</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ComponentErrorBoundary name="语音表达页面">
      <div className="min-h-screen p-4 bg-gradient-to-br from-orange-200 via-pink-200 to-purple-200">
        <div className="max-w-4xl mx-auto">
          {/* 设备信息显示 */}
          <div className="mb-4 text-center">
            <div className="inline-flex items-center space-x-2 text-sm text-gray-600 bg-white/50 rounded-lg px-3 py-1">
              {deviceInfo.isMobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
              <span>
                {deviceInfo.isMobile ? '移动设备' : '桌面设备'} · 
                {deviceInfo.isHTTPS ? '安全连接' : '非安全连接'}
              </span>
            </div>
          </div>

          {/* 标题区域 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">🎙️ 此刻，我感觉想说的是......</h1>
            <p className="text-xl text-gray-600">想到什么说什么，不用组织语言</p>
            {deviceInfo.isMobile && (
              <p className="text-sm text-orange-600 mt-2">
                💡 移动端提示：请确保允许浏览器访问麦克风权限
              </p>
            )}
          </div>

          {/* 移动端使用指南 */}
          {showMobileGuide && (
            <Card className="mb-6 bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Smartphone className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-orange-800 mb-2">移动端使用指南</h3>
                    <div className="text-sm text-orange-700 space-y-1">
                      <p>📱 建议使用Chrome或Safari浏览器</p>
                      <p>🔒 确保使用HTTPS连接</p>
                      <p>🎤 首次使用需要允许麦克风权限</p>
                      <p>📝 如果录音有问题，可以使用文字输入</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowMobileGuide(false)}
                    variant="ghost"
                    size="sm"
                    className="text-orange-600 hover:bg-orange-100"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 时间显示 */}
          <div className="flex justify-between items-center mb-8">
            <div className="text-3xl font-bold text-orange-600">⏰ {formatTime(timeLeft)}</div>
            
            {audioState.isRecording && (
              <div className="flex items-center text-green-600">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm font-medium">
                  {audioState.isPaused ? '已暂停' : '录音中'}
                </span>
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
                      onClick={
                        audioState.isRecording 
                          ? (audioState.isPaused ? handleResumeRecording : handlePauseRecording)
                          : handleStartRecording
                      }
                      disabled={!audioState.isSupported || !speechState.isSupported}
                      className={`w-32 h-32 rounded-full text-white font-semibold text-lg shadow-2xl transition-all duration-300 ${
                        audioState.isRecording && !audioState.isPaused
                          ? "bg-gradient-to-r from-red-500 to-red-600 animate-pulse scale-110"
                          : audioState.isPaused
                            ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:scale-105"
                            : "bg-gradient-to-r from-gray-400 to-gray-500 hover:from-blue-500 hover:to-purple-500 hover:scale-105 disabled:hover:scale-100"
                      }`}
                    >
                      {audioState.isRecording && !audioState.isPaused ? 
                        <MicOff className="w-8 h-8" /> : 
                        <Mic className="w-8 h-8" />
                      }
                    </Button>

                    {/* 圆形进度条 */}
                    {audioState.isRecording && (
                      <svg className="absolute inset-0 w-32 h-32 -rotate-90">
                        <circle
                          cx="64" cy="64" r="60"
                          stroke="currentColor" strokeWidth="4" fill="none"
                          className="text-gray-200"
                        />
                        <circle
                          cx="64" cy="64" r="60"
                          stroke="currentColor" strokeWidth="4" fill="none"
                          strokeDasharray={`${2 * Math.PI * 60}`}
                          strokeDashoffset={`${2 * Math.PI * 60 * (1 - getProgressPercentage() / 100)}`}
                          className="text-red-500 transition-all duration-1000"
                        />
                      </svg>
                    )}
                  </div>

                  {/* 波形动画 */}
                  {audioState.isRecording && (
                    <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                      <AudioWaveform 
                        isRecording={audioState.isRecording && !audioState.isPaused} 
                        audioLevel={audioState.audioLevel} 
                      />
                    </div>
                  )}
                </div>

                <p className="mt-12 text-lg text-gray-600">
                  {audioState.isRecording && !audioState.isPaused
                    ? "正在录音中，点击暂停"
                    : audioState.isPaused
                      ? "录音已暂停，点击继续"
                      : audioState.isSupported && speechState.isSupported
                        ? "点击开始录音"
                        : "设备不支持录音功能"}
                </p>
                
                {deviceInfo.isMobile && !audioState.isRecording && (
                  <p className="mt-2 text-sm text-gray-500">
                    移动端首次录音需要允许麦克风权限
                  </p>
                )}
              </div>

              {/* 语音转文字显示 */}
              <VoiceTranscriptDisplay
                transcript={speechState.transcript}
                isListening={speechState.isListening}
                onTranscriptChange={speechActions.setTranscript}
                isEditable={!audioState.isRecording}
              />
            </CardContent>
          </Card>

          {/* 底部控制区域 */}
          <div className="flex justify-center space-x-4">
            {speechState.transcript && (
              <Button 
                onClick={handleResetRecording} 
                variant="outline" 
                className="bg-white/80 hover:bg-white rounded-xl px-6"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                重新录制
              </Button>
            )}

            <Button
              onClick={handleComplete}
              disabled={!speechState.transcript.trim() || isAnalyzing}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl px-8 py-3 text-lg shadow-lg disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              完成表达
            </Button>
          </div>
        </div>
      </div>
    </ComponentErrorBoundary>
  )
}