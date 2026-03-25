export type ExamId = 'az-900' | 'ai-900' | 'sc-900' | 'dp-900'

export interface Exam {
  id: ExamId
  name: string
  fullName: string
  description: string
  icon: string
  color: string
  sections: string[]
  questionCount: number
  passingScore: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: string[]
}

export interface Question {
  id: string
  question: string
  choices: string[]
  correctAnswer: string
  explanation: string
  section: string
  difficulty: 'easy' | 'normal' | 'hard'
}

export interface QuizResult {
  userId: string
  examId: ExamId
  timestamp: string
  answers: AnswerRecord[]
  score: number
  totalQuestions: number
}

export interface AnswerRecord {
  questionId: string
  question: string
  selected: string
  correct: string
  isCorrect: boolean
  section: string
}

export interface SectionScore {
  section: string
  correct: number
  total: number
  percentage: number
}

export interface DashboardData {
  totalAnswered: number
  totalCorrect: number
  overallPercentage: number
  recentResults: QuizResult[]
  sectionScores: SectionScore[]
  weakSections: string[]
  studyDays: number
}
