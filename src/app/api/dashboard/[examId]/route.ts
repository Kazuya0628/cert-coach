import { NextRequest, NextResponse } from 'next/server'
import { QuizResult, DashboardData, SectionScore } from '@/types'

const inMemoryResults: QuizResult[] = []

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  const { examId } = await params
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId') || 'anonymous'

  let results: QuizResult[] = []

  if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
    const { getQuizResults } = await import('@/lib/cosmos')
    results = await getQuizResults(userId, examId)
  } else {
    results = inMemoryResults.filter(
      (r) => r.userId === userId && r.examId === examId
    )
  }

  if (results.length === 0) {
    return NextResponse.json({
      totalAnswered: 0,
      totalCorrect: 0,
      overallPercentage: 0,
      recentResults: [],
      sectionScores: [],
      weakSections: [],
      studyDays: 0,
    } as DashboardData)
  }

  const allAnswers = results.flatMap((r) => r.answers)
  const totalAnswered = allAnswers.length
  const totalCorrect = allAnswers.filter((a) => a.isCorrect).length
  const overallPercentage = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0

  // セクション別スコア
  const sectionMap = new Map<string, { correct: number; total: number }>()
  for (const answer of allAnswers) {
    const key = answer.section
    const current = sectionMap.get(key) || { correct: 0, total: 0 }
    sectionMap.set(key, {
      correct: current.correct + (answer.isCorrect ? 1 : 0),
      total: current.total + 1,
    })
  }

  const sectionScores: SectionScore[] = Array.from(sectionMap.entries()).map(
    ([section, { correct, total }]) => ({
      section,
      correct,
      total,
      percentage: Math.round((correct / total) * 100),
    })
  )

  const weakSections = sectionScores
    .filter((s) => s.percentage < 60)
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 3)
    .map((s) => s.section)

  const studyDays = new Set(
    results.map((r) => r.timestamp.split('T')[0])
  ).size

  return NextResponse.json({
    totalAnswered,
    totalCorrect,
    overallPercentage,
    recentResults: results.slice(0, 10),
    sectionScores,
    weakSections,
    studyDays,
  } as DashboardData)
}
