'use client'

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { getExam } from '@/lib/exam-data'
import { ChatMessage } from '@/types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const SUGGESTIONS: Record<string, string[]> = {
  'az-900': ['VNetとサブネットの違いは？', 'Azure ADの主要機能を教えて', 'AZ-900の出題範囲を教えて'],
  'ai-900': ['機械学習の種類を教えて', 'Azure Cognitive Servicesとは？', 'RAGとは何ですか？'],
  'sc-900': ['ゼロトラストセキュリティとは？', 'Microsoft Defenderの機能は？', 'コンプライアンスとは何ですか？'],
  'dp-900': ['リレーショナルDBと非リレーショナルDBの違いは？', 'Azure Synapse Analyticsとは？', 'データウェアハウスとは？'],
}

export default function ChatPage() {
  const { examId } = useParams<{ examId: string }>()
  const exam = getExam(examId)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text?: string) => {
    const content = text || input.trim()
    if (!content || loading) return

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content },
    ]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const assistantMsg: ChatMessage = { role: 'assistant', content: '' }
    setMessages([...newMessages, assistantMsg])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, examId }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break

          try {
            const parsed = JSON.parse(data)
            if (parsed.text) {
              accumulated += parsed.text
              setMessages((prev) => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: accumulated,
                }
                return updated
              })
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'エラーが発生しました。もう一度お試しください。',
        }
        return updated
      })
    } finally {
      setLoading(false)
    }
  }

  const suggestions = SUGGESTIONS[examId] || []

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-gray-500 hover:text-gray-700">← 戻る</Link>
        <span className="text-lg">{exam?.icon}</span>
        <div>
          <h1 className="font-semibold text-sm">{exam?.name} AIチューター</h1>
          <p className="text-xs text-gray-500">{exam?.fullName}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link href={`/exam/${examId}/quiz`} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors">📝 模擬問題</Link>
          <Link href={`/exam/${examId}/dashboard`} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors">📊 進捗</Link>
        </div>
      </header>

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">{exam?.icon}</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {exam?.name}について何でも聞いてください
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Microsoft Learnの公式ドキュメントに基づいて回答します
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-sm bg-white border border-gray-200 rounded-full px-4 py-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  {loading && i === messages.length - 1 && msg.content === '' && (
                    <span className="inline-flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 入力エリア */}
      <div className="bg-white border-t px-4 py-3">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage() }}
          className="flex gap-2 max-w-3xl mx-auto"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`${exam?.name}について質問してください...`}
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" disabled={loading || !input.trim()}>
            {loading ? '⏳' : '送信'}
          </Button>
        </form>
      </div>
    </div>
  )
}
