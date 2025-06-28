"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

export default function TestAPIPage() {
  const [testText, setTestText] = useState('我今天感觉有点焦虑和担心，不知道明天的工作怎么办')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testAPI = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('测试API开始...')
      const response = await fetch('/api/analyze-emotion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: testText }),
      })

      console.log('API响应状态:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      console.log('API响应数据:', data)
      setResult(data)
    } catch (err) {
      console.error('API测试失败:', err)
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-blue-400 via-purple-500 to-purple-600">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>🧪 API测试工具</CardTitle>
            <p className="text-gray-600">用于测试AI情感分析API是否正常工作</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">测试文本：</label>
              <Textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="输入一些包含情绪的文本..."
                className="min-h-[100px]"
              />
            </div>
            
            <Button onClick={testAPI} disabled={loading} className="w-full">
              {loading ? '测试中...' : '测试API'}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-red-800 mb-2">❌ 错误信息</h3>
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>✅ API响应结果</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">情绪词汇 ({result.emotionWords?.length || 0}个):</h4>
                  <div className="bg-gray-100 p-3 rounded mt-1">
                    {result.emotionWords?.length > 0 ? (
                      result.emotionWords.map((item: any, index: number) => (
                        <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-1">
                          {item.word} × {item.count}
                        </span>
                      ))
                    ) : (
                      <span className="text-red-500">⚠️ 无情绪词汇 - 这是问题所在！</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold">原始数据:</h4>
                  <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">💡 使用说明</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>1. 点击"测试API"按钮</li>
              <li>2. 查看返回的情绪词汇数量</li>
              <li>3. 如果情绪词汇为空，说明AI分析有问题</li>
              <li>4. 打开浏览器控制台查看详细日志</li>
              <li>5. 在Vercel Dashboard查看Functions日志</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
