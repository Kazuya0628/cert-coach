import { NextRequest, NextResponse } from 'next/server'
import { createGitHubModelsClient, CHAT_MODEL } from '@/lib/github-models'
import { searchDocuments } from '@/lib/azure-search'
import { getExam } from '@/lib/exam-data'
import { Question } from '@/types'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { examId, section, count = 5 } = body
  const difficulty: 'easy' | 'normal' | 'hard' = body.difficulty || 'normal'

  const exam = getExam(examId)
  if (!exam) {
    return NextResponse.json({ error: 'Invalid examId' }, { status: 400 })
  }

  // コンテキスト取得
  let contextText = ''
  const searchQuery = section || `${exam.fullName} ${exam.sections.join(' ')}`

  if (process.env.AZURE_SEARCH_ENDPOINT && process.env.AZURE_SEARCH_KEY) {
    try {
      const docs = await searchDocuments(searchQuery, examId, 8)
      if (docs.length > 0) {
        contextText = docs.map((d) => `【${d.section}】\n${d.content}`).join('\n\n')
      }
    } catch {
      // 検索エラーは無視
    }
  }

  const difficultyGuide = {
    easy: '基礎的な用語や概念を問う簡単な問題',
    normal: '実際の試験と同程度の標準的な問題',
    hard: 'シナリオベースの応用問題',
  }[difficulty]

  const prompt = `${exam.fullName}（${exam.name}）の試験対策問題を${count}問生成してください。

難易度: ${difficultyGuide}
${section ? `出題範囲: ${section}` : `出題範囲: ${exam.sections.join('、')}`}
${contextText ? `\n参考ドキュメント:\n${contextText}\n` : ''}

以下のJSON形式で回答してください（コードブロックなし、JSONのみ）:
{
  "questions": [
    {
      "id": "q1",
      "question": "問題文",
      "choices": ["A: 選択肢1", "B: 選択肢2", "C: 選択肢3", "D: 選択肢4"],
      "correctAnswer": "A",
      "explanation": "正解の理由と不正解の理由を含む詳細な解説",
      "section": "該当セクション名",
      "difficulty": "${difficulty}"
    }
  ]
}

重要な注意事項:
- 実際のMicrosoft認定試験に近い形式で作成
- 4択で正解は1つ
- 解説は正解の根拠と各不正解の理由を含める
- シナリオ問題も含めること`

  const client = createGitHubModelsClient()

  const response = await client.chat.completions.create({
    model: CHAT_MODEL,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content || '{}'

  try {
    const parsed = JSON.parse(content)
    const questions: Question[] = parsed.questions || []
    return NextResponse.json({ questions })
  } catch {
    return NextResponse.json({ error: 'Failed to parse questions' }, { status: 500 })
  }
}
