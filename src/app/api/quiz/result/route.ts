import { NextRequest, NextResponse } from 'next/server'
import { QuizResult } from '@/types'

// Cosmos DB未設定時はメモリ内に保存（開発用）
const inMemoryResults: QuizResult[] = []

export async function POST(req: NextRequest) {
  const body = await req.json()
  const result: QuizResult = {
    ...body,
    timestamp: new Date().toISOString(),
  }

  if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
    const { saveQuizResult } = await import('@/lib/cosmos')
    await saveQuizResult(result)
  } else {
    inMemoryResults.push(result)
  }

  return NextResponse.json({ success: true })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId') || 'anonymous'
  const examId = searchParams.get('examId') || ''

  if (process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY) {
    const { getQuizResults } = await import('@/lib/cosmos')
    const results = await getQuizResults(userId, examId)
    return NextResponse.json(results)
  }

  const filtered = inMemoryResults.filter(
    (r) => r.userId === userId && (!examId || r.examId === examId)
  )
  return NextResponse.json(filtered)
}
