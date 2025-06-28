"use client"

import { useState, useRef, useCallback, useEffect } from 'react'
import type { SpeechRecognition } from '@/types/speech-recognition'

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message?: string
}

export interface SpeechRecognitionState {
  transcript: string
  isListening: boolean
  isSupported: boolean
  error: string | null
}

export interface SpeechRecognitionActions {
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
  setTranscript: (transcript: string) => void
}

interface UseSpeechRecognitionOptions {
  continuous?: boolean
  interimResults?: boolean
  language?: string
  onResult?: (transcript: string) => void
  onError?: (error: string) => void
  onEnd?: () => void
  deviceInfo?: {
    isMobile: boolean
    isIOS: boolean
    isAndroid: boolean
  }
  maxRestartAttempts?: number
}

export function useSpeechRecognition(options: UseSpeechRecognitionOptions = {}): [SpeechRecognitionState, SpeechRecognitionActions] {
  const {
    continuous = true,
    interimResults = true,
    language = 'zh-CN',
    onResult,
    onError,
    onEnd,
    deviceInfo,
    maxRestartAttempts = 3
  } = options

  const [state, setState] = useState<SpeechRecognitionState>({
    transcript: '',
    isListening: false,
    isSupported: true,
    error: null
  })

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const restartAttemptsRef = useRef(0)
  const isStoppingRef = useRef(false)

  // 更新状态的辅助函数
  const updateState = useCallback((updates: Partial<SpeechRecognitionState>) => {
    setState((prev: SpeechRecognitionState) => ({ ...prev, ...updates }))
  }, [])

  // 检查浏览器支持
  const checkSupport = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      updateState({ 
        isSupported: false,
        error: '浏览器不支持语音识别功能'
      })
      return false
    }

    // iOS Safari特殊处理
    if (deviceInfo?.isIOS) {
      updateState({ 
        isSupported: false,
        error: 'iOS Safari对语音识别支持有限，建议使用Chrome浏览器'
      })
      return false
    }

    return true
  }, [deviceInfo, updateState])

  // 创建语音识别实例
  const createRecognition = useCallback(() => {
    if (!checkSupport()) return null

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    // 配置识别选项
    recognition.continuous = deviceInfo?.isMobile ? false : continuous
    recognition.interimResults = deviceInfo?.isMobile ? false : interimResults
    recognition.lang = language

    // 结果处理
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        }
      }

      if (finalTranscript) {
        updateState(prev => ({ 
          ...prev, 
          transcript: prev.transcript + finalTranscript 
        }))
        onResult?.(finalTranscript)
      }
    }

    // 错误处理
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("语音识别错误:", event.error)
      
      let errorMessage = ''
      let shouldRestart = false

      switch (event.error) {
        case "not-allowed":
          errorMessage = '需要麦克风权限才能使用语音功能'
          break
        case "network":
          errorMessage = '网络连接问题，请检查网络后重试'
          shouldRestart = true
          break
        case "no-speech":
          // 移动端常见，可以忽略并重试
          if (deviceInfo?.isMobile && restartAttemptsRef.current < maxRestartAttempts) {
            shouldRestart = true
          }
          break
        case "audio-capture":
          errorMessage = '无法访问麦克风，请检查设备权限设置'
          break
        case "service-not-allowed":
          errorMessage = '语音服务不可用，请检查网络连接'
          shouldRestart = true
          break
        default:
          if (restartAttemptsRef.current < maxRestartAttempts) {
            shouldRestart = true
          } else {
            errorMessage = `语音识别出现问题: ${event.error}`
          }
      }

      if (errorMessage) {
        updateState({ error: errorMessage })
        onError?.(errorMessage)
      }

      if (shouldRestart && state.isListening && !isStoppingRef.current) {
        restartAttemptsRef.current++
        setTimeout(() => {
          if (recognitionRef.current && state.isListening) {
            try {
              recognitionRef.current.start()
            } catch (error) {
              console.error("重启语音识别失败:", error)
            }
          }
        }, 1000)
      }
    }

    // 识别结束处理
    recognition.onend = () => {
      console.log('语音识别结束')
      
      if (!isStoppingRef.current && state.isListening) {
        // 移动端自动重启
        if (deviceInfo?.isMobile && restartAttemptsRef.current < maxRestartAttempts) {
          restartAttemptsRef.current++
          setTimeout(() => {
            if (recognitionRef.current && state.isListening && !isStoppingRef.current) {
              try {
                recognitionRef.current.start()
              } catch (error) {
                console.error("重启语音识别失败:", error)
              }
            }
          }, 1000)
        }
      }

      onEnd?.()
    }

    recognition.onstart = () => {
      restartAttemptsRef.current = 0
      updateState({ error: null })
    }

    return recognition
  }, [
    checkSupport, 
    deviceInfo, 
    continuous, 
    interimResults, 
    language, 
    maxRestartAttempts,
    state.isListening,
    updateState,
    onResult,
    onError,
    onEnd
  ])

  // 开始监听
  const startListening = useCallback(() => {
    if (!checkSupport()) return

    try {
      // 清理之前的实例
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }

      // 创建新实例
      const recognition = createRecognition()
      if (!recognition) return

      recognitionRef.current = recognition
      isStoppingRef.current = false
      restartAttemptsRef.current = 0

      recognition.start()
      updateState({ isListening: true, error: null })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '启动语音识别失败'
      updateState({ error: errorMessage })
      onError?.(errorMessage)
      console.error('启动语音识别失败:', error)
    }
  }, [checkSupport, createRecognition, updateState, onError])

  // 停止监听
  const stopListening = useCallback(() => {
    isStoppingRef.current = true
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.error("停止语音识别失败:", error)
      }
    }

    updateState({ isListening: false })
    recognitionRef.current = null
  }, [updateState])

  // 重置转录文本
  const resetTranscript = useCallback(() => {
    updateState({ transcript: '', error: null })
  }, [updateState])

  // 设置转录文本
  const setTranscript = useCallback((transcript: string) => {
    updateState({ transcript })
  }, [updateState])

  // 初始化检查支持
  useEffect(() => {
    checkSupport()
  }, [checkSupport])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopListening()
    }
  }, [stopListening])

  return [
    state,
    {
      startListening,
      stopListening,
      resetTranscript,
      setTranscript
    }
  ]
}