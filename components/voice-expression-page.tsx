"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Mic, MicOff, RotateCcw, CheckCircle, AlertCircle, X, Smartphone, Monitor } from "lucide-react"
import AudioWaveform from "@/components/audio-waveform"
import VoiceTranscriptDisplay from "@/components/voice-transcript-display"
import type { EmotionData } from "@/types/emotion"
import { EmotionTracker } from "@/lib/emotion-tracker"

interface VoiceExpressionPageProps {
  onComplete: (data: EmotionData, sessionInfo: { sessionNumber: number; shouldGenerateReport: boolean }) => void
}

type ErrorType = 'permission' | 'not-supported' | 'network' | 'general' | 'https-required' | 'mobile-not-supported' | null

// 设备检测
const isMobile = () => {
  if (typeof window === 'undefined') return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

const isIOS = () => {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

const isAndroid = () => {
  if (typeof window === 'undefined') return false
  return /Android/.test(navigator.userAgent)
}

// 检查HTTPS
const isHTTPS = () => {
  if (typeof window === 'undefined') return false
  return location.protocol === 'https:' || location.hostname === 'localhost'
}

// 检查浏览器支持
const checkBrowserSupport = () => {
  if (typeof window === 'undefined') return { supported: false, reason: 'SSR' }
  
  const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  const hasSpeechRecognition = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  
  if (!hasGetUserMedia) {
    return { supported: false, reason: 'no-getUserMedia' }
  }
  
  if (!hasSpeechRecognition) {
    return { supported: false, reason: 'no-speechRecognition' }
  }
  
  // 移动端Safari特殊处理
  if (isIOS() && !hasSpeechRecognition) {
    return { supported: false, reason: 'ios-safari-limitation' }
  }
  
  return { supported: true, reason: 'ok' }
}

export default function VoiceExpressionPage({ onComplete }: VoiceExpressionPageProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [timeLeft, setTimeLeft] = useState(300) // 5分钟 = 300秒
  const [isSupported, setIsSupported] = useState(true)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<{ type: ErrorType; message: string } | null>(null)
  const [deviceInfo, setDeviceInfo] = useState<{
    isMobile: boolean
    isIOS: boolean
    isAndroid: boolean
    isHTTPS: boolean
    browserSupport: { supported: boolean; reason: string }
  } | null>(null)
  const [permissionState, setPermissionState] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown')
  const [showMobileGuide, setShowMobileGuide] = useState(false)

  const recognitionRef = useRef<any>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const restartAttemptsRef = useRef(0)
  const isCleaningUpRef = useRef(false)

  const MAX_RESTART_ATTEMPTS = 3

  const cleanup = useCallback(() => {
    if (isCleaningUpRef.current) return
    isCleaningUpRef.current = true

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        // 忽略停止时的错误
      }
      recognitionRef.current = null
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close()
      } catch (e) {
        // 忽略关闭时的错误
      }
      audioContextRef.current = null
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop()
        } catch (e) {
          // 忽略停止时的错误
        }
      })
      streamRef.current = null
    }

    setAudioLevel(0)
    restartAttemptsRef.current = 0
    isCleaningUpRef.current = false
  }, [])

  const showError = useCallback((type: ErrorType, message: string) => {
    setError({ type, message })
    setIsRecording(false)
    setIsPaused(false)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // 检查麦克风权限
  const checkMicrophonePermission = useCallback(async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      setPermissionState(result.state)
      
      result.addEventListener('change', () => {
        setPermissionState(result.state)
      })
    } catch (error) {
      console.log('权限查询不支持，将在录音时检查')
    }
  }, [])

  useEffect(() => {
    // 设备检测和兼容性检查
    const deviceInfo = {
      isMobile: isMobile(),
      isIOS: isIOS(),
      isAndroid: isAndroid(),
      isHTTPS: isHTTPS(),
      browserSupport: checkBrowserSupport()
    }
    
    setDeviceInfo(deviceInfo)
    
    console.log('设备信息:', deviceInfo)

    // HTTPS检查
    if (!deviceInfo.isHTTPS) {
      setIsSupported(false)
      showError('https-required', '录音功能需要HTTPS安全连接。请确保网站使用https://开头的地址访问。')
      return
    }

    // 浏览器支持检查
    if (!deviceInfo.browserSupport.supported) {
      setIsSupported(false)
      let errorMessage = '您的浏览器不支持语音识别功能'
      
      if (deviceInfo.isIOS) {
        errorMessage = 'iOS Safari对语音识别支持有限，建议使用Chrome浏览器或手动输入文字'
        setShowMobileGuide(true)
      } else if (deviceInfo.isMobile) {
        errorMessage = '移动端建议使用Chrome浏览器以获得最佳体验'
        setShowMobileGuide(true)
      } else {
        errorMessage = '请使用Chrome、Edge或Safari浏览器'
      }
      
      showError(deviceInfo.isMobile ? 'mobile-not-supported' : 'not-supported', errorMessage)
    }

    // 权限检查
    checkMicrophonePermission()

    return () => {
      cleanup()
    }
  }, [cleanup, showError, checkMicrophonePermission])

  const startTimer = useCallback(() => {
    if (timerRef.current) return
    
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current || !isRecording || isPaused || isCleaningUpRef.current) {
      return
    }

    try {
      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      setAudioLevel(average / 255)
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
    } catch (error) {
      console.error("音频级别更新错误:", error)
    }
  }, [isRecording, isPaused])

  const setupAudioVisualization = useCallback(async (stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      analyserRef.current.fftSize = 256
      updateAudioLevel()
    } catch (error) {
      console.error("音频可视化设置失败:", error)
    }
  }, [updateAudioLevel])

  const setupSpeechRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return null

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "zh-CN"

    // 移动端优化设置
    if (deviceInfo?.isMobile) {
      recognition.continuous = false // 移动端建议关闭连续识别
      recognition.interimResults = false // 移动端关闭中间结果以提高稳定性
    }

    recognition.onresult = (event: any) => {
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript)
      }
    }

    recognition.onerror = (event: any) => {
      console.error("语音识别错误:", event.error)
      
      switch (event.error) {
        case "not-allowed":
          showError('permission', '需要麦克风权限才能使用语音功能。请点击浏览器地址栏的🔒图标，选择"允许"麦克风访问。')
          break
        case "network":
          showError('network', '网络连接问题，请检查网络后重试')
          break
        case "no-speech":
          // 移动端常见，可以忽略
          if (deviceInfo?.isMobile) {
            console.log('移动端no-speech错误，忽略')
          }
          break
        case "audio-capture":
          showError('permission', '无法访问麦克风，请检查设备权限设置')
          break
        case "service-not-allowed":
          showError('network', '语音服务不可用，请检查网络连接')
          break
        default:
          if (restartAttemptsRef.current < MAX_RESTART_ATTEMPTS) {
            // 不显示错误，尝试重启
            break
          }
          showError('general', `语音识别出现问题: ${event.error}`)
      }
    }

    recognition.onend = () => {
      console.log('语音识别结束')
      
      // 移动端处理逻辑
      if (deviceInfo?.isMobile && isRecording && !isPaused) {
        // 移动端自动重启识别
        if (restartAttemptsRef.current < MAX_RESTART_ATTEMPTS && !isCleaningUpRef.current) {
          restartAttemptsRef.current++
          setTimeout(() => {
            if (recognitionRef.current && isRecording && !isCleaningUpRef.current) {
              try {
                recognitionRef.current.start()
              } catch (error) {
                console.error("重启语音识别失败:", error)
                if (restartAttemptsRef.current >= MAX_RESTART_ATTEMPTS) {
                  showError('general', '语音识别连接不稳定，请重新开始')
                }
              }
            }
          }, 1000)
        }
      }
    }

    return recognition
  }, [isRecording, isPaused, showError])

  const startRecording = async () => {
    if (!isSupported) {
      showError('not-supported', '您的浏览器不支持语音识别功能')
      return
    }

    clearError()
    
    try {
      // 移动端特殊处理
      if (deviceInfo?.isMobile) {
        console.log('移动端录音启动流程')
        
        // 先显示权限引导
        if (permissionState === 'denied') {
          showError('permission', '麦克风权限被拒绝。请在浏览器设置中重新允许麦克风权限，然后刷新页面。')
          return
        }
      }

      // 请求麦克风权限
      console.log('请求麦克风权限...')
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // 移动端优化设置
          ...(deviceInfo?.isMobile && {
            sampleRate: 16000,
            channelCount: 1
          })
        } 
      })
      
      console.log('麦克风权限获取成功')
      streamRef.current = stream

      // 设置语音识别
      const recognition = setupSpeechRecognition()
      if (!recognition) {
        throw new Error('无法创建语音识别实例')
      }
      recognitionRef.current = recognition

      // 设置音频可视化
      await setupAudioVisualization(stream)

      console.log('启动语音识别...')
      recognition.start()
      setIsRecording(true)
      setIsPaused(false)
      restartAttemptsRef.current = 0
      startTimer()

      // 移动端成功提示
      if (deviceInfo?.isMobile) {
        console.log('移动端录音启动成功')
      }

    } catch (error: any) {
      console.error("启动录音失败:", error)
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        showError('permission', '需要麦克风权限才能使用语音功能。请在浏览器中点击"允许"按钮，然后重试。')
      } else if (error.name === 'NotFoundError') {
        showError('general', '未找到可用的麦克风设备，请检查设备连接')
      } else if (error.name === 'NotSupportedError') {
        showError('not-supported', '您的设备不支持录音功能')
      } else if (error.name === 'SecurityError') {
        showError('https-required', '录音功能需要安全连接(HTTPS)，请使用https://开头的网址访问')
      } else {
        showError('general', `启动录音失败: ${error.message || '未知错误'}`)
      }
    }
  }

  const pauseRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop()
        setIsPaused(true)
        stopTimer()
      } catch (error) {
        console.error("暂停录音失败:", error)
      }
    }
  }, [isRecording, stopTimer])

  const resumeRecording = useCallback(() => {
    if (isPaused && recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setIsPaused(false)
        restartAttemptsRef.current = 0
        startTimer()
      } catch (error) {
        console.error("恢复录音失败:", error)
        showError('general', '恢复录音失败，请重新开始')
      }
    }
  }, [isPaused, startTimer, showError])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error("停止录音失败:", error)
      }
    }
    setIsRecording(false)
    setIsPaused(false)
    stopTimer()
    setAudioLevel(0)
  }, [stopTimer])

  const resetRecording = useCallback(() => {
    cleanup()
    setTranscript("")
    setTimeLeft(300)
    clearError()
  }, [cleanup, clearError])

  const handleComplete = async () => {
    if (!transcript.trim()) {
      showError('general', '请先表达一些内容再继续')
      return
    }

    stopRecording()
    setIsAnalyzing(true)
    clearError()

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
      showError('general', '分析过程中出现问题，请重试')
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
        signal: AbortSignal.timeout(60000), // 移动端增加到60秒超时
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: '请求失败' }))
        throw new Error(errorData.error || '分析请求失败')
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('AI分析错误:', error)
      
      // 显示错误提示给用户
      let errorMessage = "AI分析暂时不可用，已为您提供基础分析结果"
      
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('timeout')) {
          errorMessage = "网络连接超时，已为您提供基础分析结果"
        } else if (error.message.includes('401')) {
          errorMessage = "API配置问题，已为您提供基础分析结果"
        }
      }
      
      // 显示友好的错误提示
      showError('network', `⚠️ ${errorMessage}`)
      
      // 如果API调用失败，使用备用分析
      // 简单的情绪词检测（备用方案）
      const emotionKeywords = [
        { words: ["开心", "高兴", "愉快", "快乐", "兴奋"], emotion: "开心" },
        { words: ["难过", "悲伤", "沮丧", "失落"], emotion: "难过" },
        { words: ["焦虑", "担心", "紧张", "害怕"], emotion: "焦虑" },
        { words: ["愤怒", "生气", "恼火", "愤慨"], emotion: "愤怒" },
        { words: ["疲惫", "累", "疲劳", "疲倦"], emotion: "疲惫" },
        { words: ["迷茫", "困惑", "不知所措"], emotion: "迷茫" },
        { words: ["平静", "安静", "淡定"], emotion: "平静" },
        { words: ["压力", "压抑", "窒息"], emotion: "压力" }
      ]
      
      const detectedEmotions: { word: string; count: number }[] = []
      const lowerText = text.toLowerCase()
      
      emotionKeywords.forEach(({ words, emotion }) => {
        const count = words.reduce((total, word) => {
          const matches = (lowerText.match(new RegExp(word, 'g')) || []).length
          return total + matches
        }, 0)
        if (count > 0) {
          detectedEmotions.push({ word: emotion, count })
        }
      })
      
      // 如果没有检测到情绪词，使用默认的
      const finalEmotionWords = detectedEmotions.length > 0 ? detectedEmotions : [
        { word: "表达", count: 1 },
        { word: "思考", count: 1 },
        { word: "感受", count: 1 }
      ]
      
      return {
        transcript: text,
        emotionWords: finalEmotionWords,
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
        },
        suggestedBenefits: [
          "你有勇气面对和表达真实的感受",
          "你正在主动寻求自我理解和成长",
          "你愿意花时间关注自己的内心世界",
          "你有自我觉察的能力和意愿"
        ],
        selectedBenefits: []
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const getProgressPercentage = () => {
    return ((300 - timeLeft) / 300) * 100
  }

  const getErrorIcon = (type: ErrorType) => {
    switch (type) {
      case 'permission':
        return <Mic className="w-5 h-5" />
      case 'network':
        return <AlertCircle className="w-5 h-5" />
      case 'https-required':
        return <AlertCircle className="w-5 h-5" />
      case 'mobile-not-supported':
        return <Smartphone className="w-5 h-5" />
      default:
        return <AlertCircle className="w-5 h-5" />
    }
  }

  const getErrorColor = (type: ErrorType) => {
    switch (type) {
      case 'permission':
        return 'bg-yellow-100 border-yellow-400 text-yellow-800'
      case 'network':
        return 'bg-blue-100 border-blue-400 text-blue-800'
      case 'https-required':
        return 'bg-red-100 border-red-400 text-red-700'
      case 'mobile-not-supported':
        return 'bg-orange-100 border-orange-400 text-orange-800'
      default:
        return 'bg-red-100 border-red-400 text-red-700'
    }
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
            {deviceInfo?.isMobile && (
              <p className="text-sm text-gray-500 mt-2">移动端网络可能需要更长时间，请耐心等待</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

      return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-orange-200 via-pink-200 to-purple-200">
        <div className="max-w-4xl mx-auto">
          {/* 设备信息显示 */}
          {deviceInfo && (
            <div className="mb-4 text-center">
              <div className="inline-flex items-center space-x-2 text-sm text-gray-600 bg-white/50 rounded-lg px-3 py-1">
                {deviceInfo.isMobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                <span>
                  {deviceInfo.isMobile ? '移动设备' : '桌面设备'} · 
                  {deviceInfo.isHTTPS ? '安全连接' : '非安全连接'} · 
                  {deviceInfo.browserSupport.supported ? '支持录音' : '不支持录音'}
                </span>
              </div>
            </div>
          )}

          {/* 顶部标题区域 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-3">🎙️ 此刻，我感觉想说的是......</h1>
            <p className="text-xl text-gray-600">想到什么说什么，不用组织语言</p>
            {deviceInfo?.isMobile && (
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
                      <p>🔒 确保使用HTTPS连接（网址以https://开头）</p>
                      <p>🎤 首次使用需要允许麦克风权限</p>
                      <p>📝 如果录音有问题，可以使用下方的文字输入功能</p>
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

        {/* 错误提示 */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg border flex items-start space-x-3 ${getErrorColor(error.type)}`}>
            {getErrorIcon(error.type)}
            <div className="flex-1">
              <p className="font-medium">{error.message}</p>
              {error.type === 'permission' && (
                <div className="text-sm mt-2 space-y-1">
                  <p>💡 解决方法：</p>
                  <p>1. 点击浏览器地址栏的🔒图标</p>
                  <p>2. 选择"允许"麦克风访问权限</p>
                  <p>3. 刷新页面重试</p>
                </div>
              )}
              {error.type === 'https-required' && (
                <div className="text-sm mt-2">
                  <p>💡 请确保网站地址以 https:// 开头</p>
                </div>
              )}
              {error.type === 'mobile-not-supported' && (
                <div className="text-sm mt-2">
                  <p>💡 可以使用下方的文字输入功能作为替代</p>
                </div>
              )}
            </div>
            <Button
              onClick={clearError}
              variant="ghost"
              size="sm"
              className="text-current hover:bg-black/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* 时间显示 */}
        <div className="flex justify-between items-center mb-8">
          <div className="text-3xl font-bold text-orange-600">⏰ {formatTime(timeLeft)}</div>
          
          {isRecording && (
            <div className="flex items-center text-green-600">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-sm font-medium">
                {isPaused ? '已暂停' : '录音中'}
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
                    onClick={isRecording ? (isPaused ? resumeRecording : pauseRecording) : startRecording}
                    disabled={!isSupported || (error?.type === 'permission')}
                    className={`w-32 h-32 rounded-full text-white font-semibold text-lg shadow-2xl transition-all duration-300 ${
                      isRecording && !isPaused
                        ? "bg-gradient-to-r from-red-500 to-red-600 animate-pulse scale-110"
                        : isPaused
                          ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:scale-105"
                          : "bg-gradient-to-r from-gray-400 to-gray-500 hover:from-blue-500 hover:to-purple-500 hover:scale-105 disabled:hover:scale-100 disabled:hover:from-gray-400 disabled:hover:to-gray-500"
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
                      ? error?.type === 'permission' 
                        ? "请允许麦克风权限后开始录音"
                        : "点击开始录音"
                      : "浏览器不支持语音功能"}
              </p>
              
              {deviceInfo?.isMobile && !isRecording && (
                <p className="mt-2 text-sm text-gray-500">
                  移动端首次录音需要允许麦克风权限
                </p>
              )}
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
            disabled={!transcript.trim() || isAnalyzing}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl px-8 py-3 text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            完成表达
          </Button>
        </div>
      </div>
    </div>
  )
}