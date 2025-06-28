"use client"

import type React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { EmotionData } from "@/app/page"

interface EmotionChartProps {
  emotionData: EmotionData
}

const EmotionChart: React.FC<EmotionChartProps> = ({ emotionData }) => {
  const data = emotionData.emotionWords.map((item) => ({
    name: item.word,
    count: item.count,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default EmotionChart
