"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, Edit3 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VoiceTranscriptDisplayProps {
  transcript: string
  isListening: boolean
  onTranscriptChange: (text: string) => void
  isEditable?: boolean
}

export default function VoiceTranscriptDisplay({
  transcript,
  isListening,
  onTranscriptChange,
  isEditable = false,
}: VoiceTranscriptDisplayProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcript])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcript)
      // 可以添加复制成功的提示
    } catch (err) {
      console.error("复制失败:", err)
    }
  }

  const wordCount = transcript
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length

  return (
    <Card className="w-full bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">{isListening ? "正在聆听..." : "你的表达内容"}</h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">{wordCount} 字</span>
            {transcript && (
              <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 w-6 p-0">
                <Copy className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        <div ref={scrollRef} className="min-h-[150px] max-h-[300px] overflow-y-auto">
          {transcript ? (
            isEditable ? (
              <textarea
                ref={textareaRef}
                value={transcript}
                onChange={(e) => onTranscriptChange(e.target.value)}
                className="w-full min-h-[140px] p-3 text-gray-700 bg-transparent border-none resize-none focus:outline-none leading-relaxed"
                placeholder="你可以在这里编辑你的表达内容..."
              />
            ) : (
              <div className="p-3 text-gray-700 leading-relaxed whitespace-pre-wrap">
                {transcript}
                {isListening && <span className="inline-block w-2 h-5 bg-blue-500 ml-1 animate-pulse" />}
              </div>
            )
          ) : (
            <div className="p-3 text-gray-400 italic text-center leading-relaxed">
              {isListening ? "开始说话，你的话语会在这里实时显示..." : "开始录音后，你的话语会在这里实时显示..."}
            </div>
          )}
        </div>

        {transcript && !isEditable && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onTranscriptChange(transcript)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              <Edit3 className="w-3 h-3 mr-1" />
              编辑内容
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
