'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import type { WeeklyReport } from '@/lib/emotion-tracker'
import { TrendingUp, Calendar, Target, Lightbulb, Heart, Sparkles } from 'lucide-react'

interface WeeklyReportPageProps {
  report: WeeklyReport
  onStartNewCycle: () => void
  onViewHistory: () => void
}

export default function WeeklyReportPage({ 
  report, 
  onStartNewCycle, 
  onViewHistory 
}: WeeklyReportPageProps) {
  const [animatedValues, setAnimatedValues] = useState<number[]>(new Array(7).fill(0))

  // 动画效果：逐步显示强度值
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Array.isArray(report.emotionTrends)) {
        setAnimatedValues(report.emotionTrends.map(trend => trend.intensity))
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [report.emotionTrends])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      month: 'long',
      day: 'numeric'
    })
  }

  const getEmotionColor = (emotion: string) => {
    const colorMap: Record<string, string> = {
      '开心': 'bg-yellow-500',
      '快乐': 'bg-yellow-500',
      '兴奋': 'bg-orange-500',
      '焦虑': 'bg-red-500',
      '担心': 'bg-red-400',
      '紧张': 'bg-red-400',
      '悲伤': 'bg-blue-500',
      '难过': 'bg-blue-400',
      '平静': 'bg-green-500',
      '放松': 'bg-green-400',
      '愤怒': 'bg-red-600',
      '生气': 'bg-red-600',
      '失望': 'bg-gray-500',
      '迷茫': 'bg-purple-500',
    }
    return colorMap[emotion] || 'bg-gray-400'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 标题区域 */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              情绪成长周报
            </h1>
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>
              {report.startDate && report.endDate 
                ? `${formatDate(report.startDate)} - ${formatDate(report.endDate)}`
                : '7天情绪记录周期'
              }
            </span>
          </div>
          <Badge variant="secondary" className="text-lg px-4 py-1">
            共完成 {report.totalSessions || 7} 次情绪记录
          </Badge>
        </div>

        {/* 情绪趋势图 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              情绪强度变化趋势
            </CardTitle>
            <CardDescription>
              展示您这7天的情绪强度变化，数值越高表示情绪越强烈
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(Array.isArray(report.emotionTrends) ? report.emotionTrends : []).map((trend, index) => (
                <div key={trend.session} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium w-12">第{trend.session}天</span>
                      <Badge 
                        variant="outline" 
                        className={`${getEmotionColor(trend.dominantEmotion)} text-white border-none`}
                      >
                        {trend.dominantEmotion}
                      </Badge>
                      <span className="text-xs text-gray-500">{trend.date}</span>
                    </div>
                    <span className="text-sm font-medium">{Math.round(animatedValues[index] || 0)}%</span>
                  </div>
                  <Progress 
                    value={animatedValues[index] || 0} 
                    className="h-2"
                  />
                </div>
              ))}
              {(!Array.isArray(report.emotionTrends) || report.emotionTrends.length === 0) && (
                <div className="text-center p-8 text-gray-500">
                  <p>正在为你分析情绪趋势...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 深度洞察 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              AI深度洞察
            </CardTitle>
            <CardDescription>
              基于您7天的表达，AI识别出的情绪模式和特点
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(Array.isArray(report.insights) ? report.insights : []).map((insight, index) => (
                <div key={index} className="flex gap-3 p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                  <div className="flex-shrink-0 w-6 h-6 bg-yellow-400 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 leading-relaxed">{insight}</p>
                </div>
              ))}
              {(!Array.isArray(report.insights) || report.insights.length === 0) && (
                <div className="text-center p-8 text-gray-500">
                  <p>正在为你整理深度洞察...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 个人成长轨迹 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-pink-600" />
              个人成长轨迹
            </CardTitle>
            <CardDescription>
              您在情绪觉察和自我认知方面的显著进步
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
              <p className="text-gray-700 leading-relaxed text-lg">
                {report.personalGrowth || '正在为你整理个人成长轨迹...'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 未来建议 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              个性化建议
            </CardTitle>
            <CardDescription>
              基于您的情绪模式，为您量身定制的成长建议
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {(Array.isArray(report.recommendations) ? report.recommendations : []).map((recommendation, index) => (
                <div key={index} className="flex gap-3 p-4 bg-green-50 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center">
                    <Target className="h-3 w-3" />
                  </div>
                  <p className="text-gray-700 leading-relaxed">{recommendation}</p>
                </div>
              ))}
              {(!Array.isArray(report.recommendations) || report.recommendations.length === 0) && (
                <div className="text-center p-8 text-gray-500">
                  <p>正在为你整理个性化建议...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 进步总结 */}
        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Sparkles className="h-5 w-5" />
              成长庆祝
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-6xl">🎉</div>
              <p className="text-lg text-gray-700 leading-relaxed">
                {report.progressSummary || '正在为你整理成长总结...'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex gap-4 justify-center pb-8">
          <Button 
            onClick={onStartNewCycle}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            开始新的7天探索
          </Button>
          <Button 
            onClick={onViewHistory}
            variant="outline"
            size="lg"
          >
            查看历史记录
          </Button>
        </div>
      </div>
    </div>
  )
}
