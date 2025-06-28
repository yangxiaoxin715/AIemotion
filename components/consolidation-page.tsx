"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import type { ConsolidationData } from "@/app/page"
import { Star, Eye, MessageCircle } from "lucide-react"

interface ConsolidationPageProps {
  onComplete: (data: ConsolidationData) => void
}

export default function ConsolidationPage({ onComplete }: ConsolidationPageProps) {
  const [discovered, setDiscovered] = useState("")
  const [reminder, setReminder] = useState("")

  const handleComplete = () => {
    if (!discovered.trim() || !reminder.trim()) {
      alert("请完成两个输入框的内容")
      return
    }

    const data: ConsolidationData = {
      discovered: discovered.trim(),
      reminder: reminder.trim(),
    }

    onComplete(data)
  }

  const isComplete = discovered.trim().length > 0 && reminder.trim().length > 0

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-4xl font-bold text-gray-800 mb-4">✨ 攒个好处给自己</CardTitle>
          <p className="text-xl text-gray-600 leading-relaxed">
            每一次深入思考都是成长的机会
            <br />
            记录下这次的收获，为未来的自己留下智慧
          </p>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* 今天我看见了 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-800">今天我看见了：</h3>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6">
              <p className="text-gray-700 mb-4 leading-relaxed">
                💡 通过这次表达和思考，你对自己有了什么新的认识？发现了什么之前没注意到的模式或特点？
              </p>
              <Textarea
                value={discovered}
                onChange={(e) => setDiscovered(e.target.value)}
                placeholder="例如：我发现自己在压力大的时候总是习惯性地责怪自己，但其实我一直在很努力地应对困难..."
                className="min-h-[150px] text-lg leading-relaxed border-2 focus:border-blue-400 rounded-xl bg-white"
              />
            </div>
          </div>

          {/* 想提醒未来的我 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-800">想提醒未来的我：</h3>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
              <p className="text-gray-700 mb-4 leading-relaxed">
                💌 如果未来再遇到类似的情况，你希望提醒自己什么？有什么智慧想传递给未来的自己？
              </p>
              <Textarea
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
                placeholder="例如：记住，感到焦虑是正常的，这说明你在乎。给自己一些时间和耐心，你比想象中更有韧性..."
                className="min-h-[150px] text-lg leading-relaxed border-2 focus:border-purple-400 rounded-xl bg-white"
              />
            </div>
          </div>

          {/* 完成按钮 */}
          <div className="text-center pt-6">
            <Button
              onClick={handleComplete}
              disabled={!isComplete}
              className="bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white px-12 py-4 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Star className="w-5 h-5 mr-2" />
              {isComplete ? "保存到成长库" : "请完成两个输入框"}
            </Button>

            {isComplete && <p className="text-sm text-gray-500 mt-3">💾 你的成长记录将保存在本地，随时可以回顾</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
