import { NextRequest } from 'next/server'
import { createGitHubModelsClient, CHAT_MODEL } from '@/lib/github-models'
import { searchDocuments } from '@/lib/azure-search'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { messages, examId } = await req.json()
  const userMessage = messages[messages.length - 1]?.content || ''

  // Azure AI SearchでRAG検索（設定済みの場合のみ）
  let contextText = ''
  let sources: string[] = []

  if (process.env.AZURE_SEARCH_ENDPOINT && process.env.AZURE_SEARCH_KEY) {
    try {
      const docs = await searchDocuments(userMessage, examId, 5)
      if (docs.length > 0) {
        contextText = docs
          .map((d) => `【${d.section}】\n${d.content}`)
          .join('\n\n---\n\n')
        sources = [...new Set(docs.map((d) => d.source_url).filter(Boolean))]
      }
    } catch {
      // 検索エラーは無視してLLMのみで応答
    }
  }

  const systemPrompt = contextText
    ? `あなたはMicrosoft認定資格の試験対策AIチューターです。
以下のMicrosoft Learnの公式ドキュメントに基づいて、正確でわかりやすい回答をしてください。
ドキュメントにない内容については、一般的なAzure/Microsoft知識で補完してください。

【参考ドキュメント】
${contextText}

回答の最後に「📚 参考:」として参照URLを記載してください。`
    : `あなたはMicrosoft認定資格の試験対策AIチューターです。
${examId.toUpperCase()}の試験に関する質問に、わかりやすく正確に回答してください。
具体例や図解（テキストで表現）を使って説明するとより効果的です。`

  const client = createGitHubModelsClient()

  const stream = await client.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
    stream: true,
  })

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content || ''
        if (text) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
        }
      }
      if (sources.length > 0) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ sources })}\n\n`)
        )
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
