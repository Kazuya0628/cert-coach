import Link from 'next/link'
import { EXAMS } from '@/lib/exam-data'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const colorMap: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-200 hover:border-blue-400',
  purple: 'bg-purple-50 border-purple-200 hover:border-purple-400',
  green: 'bg-green-50 border-green-200 hover:border-green-400',
  orange: 'bg-orange-50 border-orange-200 hover:border-orange-400',
}

const badgeColorMap: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  green: 'bg-green-100 text-green-700',
  orange: 'bg-orange-100 text-orange-700',
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            🎓 Cert Coach
          </h1>
          <p className="text-lg text-gray-600">
            Microsoft認定資格 AI学習アシスタント
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Microsoft Learnの公式ドキュメントに基づいたRAGチャット・模擬問題で合格を目指そう
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {EXAMS.map((exam) => (
            <Card
              key={exam.id}
              className={`border-2 transition-all ${colorMap[exam.color]}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{exam.icon}</span>
                  <Badge className={badgeColorMap[exam.color]}>{exam.name}</Badge>
                </div>
                <CardTitle className="text-lg">{exam.fullName}</CardTitle>
                <CardDescription>{exam.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-gray-500 mb-4">
                  出題範囲: {exam.sections.length}セクション ／ 試験問題数: {exam.questionCount}問 ／ 合格ライン: {exam.passingScore}点
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/exam/${exam.id}/chat`}
                    className="flex-1 text-center py-2 px-3 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    💬 AIチャット
                  </Link>
                  <Link
                    href={`/exam/${exam.id}/quiz`}
                    className="flex-1 text-center py-2 px-3 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    📝 模擬問題
                  </Link>
                  <Link
                    href={`/exam/${exam.id}/dashboard`}
                    className="flex-1 text-center py-2 px-3 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    📊 進捗
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <strong>💡 使い方:</strong> 学習したい資格を選んで、AIチャットで疑問を解消しながら模擬問題で実力確認。ダッシュボードで弱点を把握しましょう。
        </div>
      </div>
    </main>
  )
}
