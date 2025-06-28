"use client"

import { useState, useRef, useCallback, useEffect } from 'react'

export interface AudioRecordingState {
  isRecording: boolean
  isPaused: boolean
  audioLevel: number
  error: string | null
  isSupported: boolean
}

export interface AudioRecordingActions {
  startRecording: () => Promise<void>
  stopRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void
  cleanup: () => void
}

interface UseAudioRecordingOptions {
  onStart?: () => void
  onStop?: () => void
  onError?: (error: string) => void
  deviceInfo?: {
    isMobile: boolean
    isIOS: boolean
    isAndroid: boolean
    isHTTPS: boolean
  }
}

export function useAudioRecording(options: UseAudioRecordingOptions = {}): [AudioRecordingState, AudioRecordingActions] {
  const [state, setState] = useState<AudioRecordingState>({
    isRecording: false,
    isPaused: false,
    audioLevel: 0,
    error: null,
    isSupported: true
  })

  // Refs for cleanup
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isCleaningUpRef = useRef(false)

  // 更新状态的辅助函数
  const updateState = useCallback((updates: Partial<AudioRecordingState>) => {
    setState(prev => ({ ...prev, ...updates }))
  }, [])

  // 清理资源
  const cleanup = useCallback(() => {
    if (isCleaningUpRef.current) return
    isCleaningUpRef.current = true

    try {
      // 取消动画帧
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      // 关闭音频上下文
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error)
        audioContextRef.current = null
      }

      // 停止媒体流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          try {
            track.stop()
          } catch (error) {
            console.error('停止音频轨道失败:', error)
          }
        })
        streamRef.current = null
      }

      // 清理分析器引用
      analyserRef.current = null

      // 重置状态
      updateState({
        isRecording: false,
        isPaused: false,
        audioLevel: 0,
        error: null
      })

    } catch (error) {
      console.error('清理音频资源失败:', error)
    } finally {
      isCleaningUpRef.current = false
    }
  }, [updateState])

  // 音频级别更新函数（修复内存泄漏）
  const updateAudioLevel = useCallback(() => {
    // 检查是否应该继续更新
    if (!analyserRef.current || 
        !state.isRecording || 
        state.isPaused || 
        isCleaningUpRef.current) {
      return
    }

    try {
      const bufferLength = analyserRef.current.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)
      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length
      
      updateState({ audioLevel: average / 255 })
      
      // 只有在仍在录音状态时才继续循环
      if (state.isRecording && !state.isPaused && !isCleaningUpRef.current) {
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
      }
    } catch (error) {
      console.error("音频级别更新错误:", error)
      // 发生错误时停止更新循环
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [state.isRecording, state.isPaused, updateState])

  // 设置音频可视化
  const setupAudioVisualization = useCallback(async (stream: MediaStream) => {
    try {
      // 清理之前的音频上下文
      if (audioContextRef.current) {
        await audioContextRef.current.close()
      }

      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      const source = audioContextRef.current.createMediaStreamSource(stream)
      source.connect(analyserRef.current)

      analyserRef.current.fftSize = 256
      
      // 开始音频级别监控
      updateAudioLevel()
    } catch (error) {
      console.error("音频可视化设置失败:", error)
      options.onError?.('音频可视化设置失败')
    }
  }, [updateAudioLevel, options])

  // 开始录音
  const startRecording = useCallback(async () => {
    try {
      // 清理之前的资源
      cleanup()

      // 检查浏览器支持
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('浏览器不支持录音功能')
      }

      updateState({ error: null })

      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // 移动端优化设置
          ...(options.deviceInfo?.isMobile && {
            sampleRate: 16000,
            channelCount: 1
          })
        } 
      })

      streamRef.current = stream
      
      // 设置音频可视化
      await setupAudioVisualization(stream)

      updateState({ 
        isRecording: true, 
        isPaused: false,
        error: null 
      })

      options.onStart?.()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '启动录音失败'
      updateState({ error: errorMessage })
      options.onError?.(errorMessage)
      console.error('启动录音失败:', error)
    }
  }, [cleanup, updateState, setupAudioVisualization, options])

  // 停止录音
  const stopRecording = useCallback(() => {
    updateState({ isRecording: false, isPaused: false })
    
    // 延迟清理，确保状态更新完成
    setTimeout(() => {
      cleanup()
      options.onStop?.()
    }, 100)
  }, [cleanup, updateState, options])

  // 暂停录音
  const pauseRecording = useCallback(() => {
    if (state.isRecording && !state.isPaused) {
      updateState({ isPaused: true })
      
      // 停止音频级别监控
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [state.isRecording, state.isPaused, updateState])

  // 恢复录音
  const resumeRecording = useCallback(() => {
    if (state.isRecording && state.isPaused) {
      updateState({ isPaused: false })
      
      // 重新开始音频级别监控
      if (analyserRef.current) {
        updateAudioLevel()
      }
    }
  }, [state.isRecording, state.isPaused, updateState, updateAudioLevel])

  // 检查浏览器支持
  useEffect(() => {
    const checkSupport = () => {
      const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      
      if (!hasGetUserMedia) {
        updateState({ 
          isSupported: false,
          error: '浏览器不支持录音功能'
        })
      }

      // HTTPS检查
      if (!options.deviceInfo?.isHTTPS) {
        updateState({ 
          isSupported: false,
          error: '录音功能需要HTTPS安全连接'
        })
      }
    }

    checkSupport()
  }, [options.deviceInfo, updateState])

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  // 当录音状态改变时，管理音频级别监控
  useEffect(() => {
    if (state.isRecording && !state.isPaused && analyserRef.current) {
      // 如果没有正在运行的动画帧，开始监控
      if (!animationFrameRef.current) {
        updateAudioLevel()
      }
    } else {
      // 停止监控
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [state.isRecording, state.isPaused, updateAudioLevel])

  return [
    state,
    {
      startRecording,
      stopRecording,
      pauseRecording,
      resumeRecording,
      cleanup
    }
  ]
}