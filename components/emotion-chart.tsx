"use client"

import type React from "react"
import type { EmotionData } from "@/types/emotion"

interface EmotionChartProps {
  emotionData: EmotionData
}

const EmotionChart: React.FC<EmotionChartProps> = ({ emotionData }) => {
  if (!emotionData.emotionWords.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        <p>暂无情绪数据</p>
      </div>
    )
  }

  const maxCount = Math.max(...emotionData.emotionWords.map(item => item.count))

  return (
    <div className="h-64 flex items-end justify-center space-x-4 p-4">
      {emotionData.emotionWords.map((item, index) => {
        const height = (item.count / maxCount) * 180 // 最大高度180px
        const colors = [
          'bg-gradient-to-t from-blue-400 to-blue-500',
          'bg-gradient-to-t from-purple-400 to-purple-500', 
          'bg-gradient-to-t from-pink-400 to-pink-500',
          'bg-gradient-to-t from-orange-400 to-orange-500',
          'bg-gradient-to-t from-green-400 to-green-500',
          'bg-gradient-to-t from-red-400 to-red-500',
          'bg-gradient-to-t from-yellow-400 to-yellow-500',
          'bg-gradient-to-t from-indigo-400 to-indigo-500',
        ]
        const colorClass = colors[index % colors.length]
        
        return (
          <div key={item.word} className="flex flex-col items-center group">
            <div className="relative">
              <div
                className={`w-12 ${colorClass} rounded-t-lg transition-all duration-300 group-hover:scale-105 shadow-lg`}
                style={{ height: `${height}px` }}
              />
              
              {/* 数值显示 */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {item.count}
              </div>
            </div>
            
            {/* 标签 */}
            <div className="mt-2 text-sm font-medium text-gray-700 text-center">
              {item.word}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default EmotionChart
