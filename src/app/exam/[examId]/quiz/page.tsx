'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getExam } from '@/lib/exam-data'
import { Question, AnswerRecord } from '@/types'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

type Phase = 'setup' | 'quiz' | 'result'

export default function QuizPage() {
  const { examId } = useParams<{ examId: string }>()
  const exam = getExam(examId)

  const [phase, setPhase] = useState<Phase>('setup')
  const [section, setSection] = useState('')
  const [count, setCount] = useState(5)
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal')
  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [loading, setLoading] = useState(false)

  const startQuiz = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId, section: section || undefined, count, difficulty }),
      })
      const data = await res.json()
      setQuestions(data.questions || [])
      setCurrent(0)
      setAnswers([])
      setSelected(null)
      setAnswered(false)
      setPhase('quiz')
    } catch {
      alert('問題の生成に失敗しました。もう一度お試しください。')
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (choice: string) => {
    if (answered) return
    setSelected(choice)
  }

  const handleConfirm = async () => {
    if (!selected || !questions[current]) return
    setAnswered(true)

    const q = questions[current]
    const isCorrect = selected.startsWith(q.correctAnswer)
    const record: AnswerRecord = {
      questionId: q.id,
      question: q.question,
      selected,
      correct: q.correctAnswer,
      isCorrect,
      section: q.section,
    }
    const newAnswers = [...answers, record]
    setAnswers(newAnswers)

    if (current === questions.length - 1) {
      // 結果を保存
      await fetch('/api/quiz/result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'anonymous',
          examId,
          answers: newAnswers,
          score: newAnswers.filter((a) => a.isCorrect).length,
          totalQuestions: questions.length,
        }),
      }).catch(() => {})
    }
  }

  const handleNext = () => {
    if (current === questions.length - 1) {
      setPhase('result')
    } else {
      setCurrent((c) => c + 1)
      setSelected(null)
      setAnswered(false)
    }
  }

  if (!exam) return <div>Not found</div>

  // セットアップ画面
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-md w-full">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← 戻る</Link>
          </div>
          <div className="text-center mb-6">
            <span className="text-4xl">{exam.icon}</span>
            <h1 className="text-xl font-bold mt-2">{exam.name} 模擬問題</h1>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">出題範囲</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="">全セクション</option>
                {exam.sections.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">問題数: {count}問</label>
              <input
                type="range"
                min={3}
                max={10}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">難易度</label>
              <div className="flex gap-2">
                {(['easy', 'normal', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                      difficulty === d
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {d === 'easy' ? '😊 簡単' : d === 'normal' ? '📚 標準' : '🔥 難しい'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={startQuiz}
            disabled={loading}
            className="w-full mt-6"
          >
            {loading ? '🤖 問題を生成中...' : '📝 問題を生成する'}
          </Button>
        </div>
      </div>
    )
  }

  // クイズ画面
  if (phase === 'quiz' && questions.length > 0) {
    const q = questions[current]
    const isCorrect = answered && selected?.startsWith(q.correctAnswer)

    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">{exam.name}</span>
            <span className="text-sm font-medium">{current + 1} / {questions.length}</span>
          </div>
          <Progress value={((current + 1) / questions.length) * 100} className="mb-6" />

          <div className="bg-white rounded-2xl border p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="text-xs">{q.section}</Badge>
              <Badge variant="outline" className="text-xs">{q.difficulty}</Badge>
            </div>
            <p className="text-base font-medium text-gray-900 leading-relaxed">{q.question}</p>
          </div>

          <div className="space-y-3 mb-4">
            {q.choices.map((choice) => {
              const letter = choice.charAt(0)
              const isSelected = selected === choice
              const isCorrectChoice = letter === q.correctAnswer

              let className = 'w-full text-left p-4 rounded-xl border-2 transition-all text-sm '
              if (!answered) {
                className += isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } else {
                if (isCorrectChoice) className += 'border-green-500 bg-green-50'
                else if (isSelected && !isCorrectChoice) className += 'border-red-500 bg-red-50'
                else className += 'border-gray-200 bg-white'
              }

              return (
                <button key={choice} onClick={() => handleSelect(choice)} className={className}>
                  {choice}
                </button>
              )
            })}
          </div>

          {answered && (
            <div className={`rounded-xl p-4 mb-4 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <p className={`font-semibold mb-2 ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {isCorrect ? '✅ 正解！' : `❌ 不正解（正解: ${q.correctAnswer}）`}
              </p>
              <p className="text-sm text-gray-700">{q.explanation}</p>
            </div>
          )}

          <div className="flex gap-3">
            {!answered && (
              <Button onClick={handleConfirm} disabled={!selected} className="flex-1">
                確認する
              </Button>
            )}
            {answered && (
              <Button onClick={handleNext} className="flex-1">
                {current === questions.length - 1 ? '結果を見る' : '次の問題 →'}
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 結果画面
  const correct = answers.filter((a) => a.isCorrect).length
  const percentage = Math.round((correct / answers.length) * 100)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">
            {percentage >= 70 ? '🎉' : percentage >= 50 ? '💪' : '📚'}
          </div>
          <h2 className="text-2xl font-bold">{percentage}点</h2>
          <p className="text-gray-600">{correct} / {answers.length}問 正解</p>
          {percentage >= 70 && <p className="text-green-600 font-medium mt-1">合格ライン達成！</p>}
        </div>

        <div className="space-y-2 mb-6">
          {answers.map((a, i) => (
            <div key={i} className={`flex items-start gap-2 p-3 rounded-lg text-sm ${a.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <span>{a.isCorrect ? '✅' : '❌'}</span>
              <span className="text-gray-700 line-clamp-2">{a.question}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setPhase('setup')} className="flex-1">
            もう一度
          </Button>
          <Link href={`/exam/${examId}/dashboard`} className="flex-1">
            <Button className="w-full">📊 ダッシュボード</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
