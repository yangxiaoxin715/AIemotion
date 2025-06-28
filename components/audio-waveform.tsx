"use client"

import { useEffect, useState } from "react"

interface AudioWaveformProps {
  isRecording: boolean
  audioLevel?: number
}

export default function AudioWaveform({ isRecording, audioLevel = 0 }: AudioWaveformProps) {
  const [animationKey, setAnimationKey] = useState(0)

  useEffect(() => {
    if (isRecording) {
      setAnimationKey((prev) => prev + 1)
    }
  }, [isRecording])

  const bars = Array.from({ length: 7 }, (_, index) => {
    const baseHeight = 20
    const maxHeight = 60
    const animatedHeight = isRecording
      ? baseHeight + audioLevel * (maxHeight - baseHeight) + Math.sin(Date.now() / 200 + index) * 10
      : baseHeight

    return (
      <div
        key={`${animationKey}-${index}`}
        className={`bg-gradient-to-t from-blue-500 to-purple-500 rounded-full transition-all duration-150 ${
          isRecording ? "opacity-100" : "opacity-50"
        }`}
        style={{
          width: "4px",
          height: `${Math.max(baseHeight, Math.min(maxHeight, animatedHeight))}px`,
          animationDelay: `${index * 0.1}s`,
        }}
      />
    )
  })

  return (
    <div className="flex items-end justify-center space-x-1 h-16">
      {bars}
      <style jsx>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.5); }
        }
        .animate-wave {
          animation: wave 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
