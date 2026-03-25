'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import { getExam } from '@/lib/exam-data'
import { DashboardData } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  const { examId } = useParams<{ examId: string }>()
  const exam = getExam(examId)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/dashboard/${examId}?userId=anonymous`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [examId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    )
  }

  if (!data || data.totalAnswered === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">まだ学習データがありません</h2>
          <p className="text-gray-500 text-sm mb-6">模擬問題を解いてデータを蓄積しましょう</p>
          <Link href={`/exam/${examId}/quiz`}>
            <Button>📝 模擬問題を始める</Button>
          </Link>
        </div>
      </div>
    )
  }

  const radarData = data.sectionScores.map((s) => ({
    section: s.section.length > 10 ? s.section.slice(0, 10) + '…' : s.section,
    value: s.percentage,
    fullMark: 100,
  }))

  const trendData = data.recentResults.slice().reverse().map((r, i) => ({
    name: `${i + 1}回目`,
    score: Math.round((r.score / r.totalQuestions) * 100),
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 戻る</Link>
          <span className="text-lg">{exam?.icon}</span>
          <h1 className="font-bold">{exam?.name} 学習ダッシュボード</h1>
          <div className="ml-auto flex gap-2">
            <Link href={`/exam/${examId}/chat`}>
              <Button variant="outline" size="sm">💬 チャット</Button>
            </Link>
            <Link href={`/exam/${examId}/quiz`}>
              <Button size="sm">📝 問題を解く</Button>
            </Link>
          </div>
        </div>

        {/* サマリー */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: '総合スコア', value: `${data.overallPercentage}%`, icon: '🎯' },
            { label: '総回答数', value: `${data.totalAnswered}問`, icon: '📝' },
            { label: '正解数', value: `${data.totalCorrect}問`, icon: '✅' },
            { label: '学習日数', value: `${data.studyDays}日`, icon: '📅' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-gray-500">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* セクション別レーダー */}
          {radarData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">セクション別正答率</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="section" tick={{ fontSize: 10 }} />
                    <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* スコア推移 */}
          {trendData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">スコア推移</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trendData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${v}%`, 'スコア']} />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 弱点セクション */}
        {data.weakSections.length > 0 && (
          <Card className="mb-6 border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-sm text-orange-700">⚠️ 強化が必要なセクション</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {data.weakSections.map((s) => (
                  <Link key={s} href={`/exam/${examId}/quiz?section=${encodeURIComponent(s)}`}>
                    <span className="inline-block bg-orange-100 text-orange-700 text-sm px-3 py-1 rounded-full hover:bg-orange-200 transition-colors cursor-pointer">
                      {s} →
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* セクション別スコア一覧 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">セクション別詳細</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.sectionScores.map((s) => (
                <div key={s.section}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{s.section}</span>
                    <span className="font-medium">{s.percentage}% ({s.correct}/{s.total})</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        s.percentage >= 70 ? 'bg-green-500' : s.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-400'
                      }`}
                      style={{ width: `${s.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
