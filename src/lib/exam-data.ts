import { Exam } from '@/types'

export const EXAMS: Exam[] = [
  {
    id: 'az-900',
    name: 'AZ-900',
    fullName: 'Microsoft Azure Fundamentals',
    description: 'Azureクラウドサービスの基礎概念を証明する資格。ITバックグラウンドがない方にも適しています。',
    icon: '☁️',
    color: 'blue',
    sections: [
      'クラウドの概念',
      'Azureのアーキテクチャとサービス',
      'Azureの管理とガバナンス',
    ],
    questionCount: 40,
    passingScore: 700,
  },
  {
    id: 'ai-900',
    name: 'AI-900',
    fullName: 'Microsoft Azure AI Fundamentals',
    description: 'AIと機械学習の基礎概念と、AzureのAIサービスに関する知識を証明する資格。',
    icon: '🤖',
    color: 'purple',
    sections: [
      'AIワークロードと考慮事項',
      'Azureでの機械学習',
      'Azure上のコンピュータービジョン',
      'Azure上の自然言語処理',
      'Azure上のナレッジマイニングと生成AI',
    ],
    questionCount: 40,
    passingScore: 700,
  },
  {
    id: 'sc-900',
    name: 'SC-900',
    fullName: 'Microsoft Security, Compliance, and Identity Fundamentals',
    description: 'セキュリティ、コンプライアンス、IDの基礎概念とMicrosoftのソリューションを証明する資格。',
    icon: '🔐',
    color: 'green',
    sections: [
      'セキュリティ、コンプライアンス、IDの概念',
      'Microsoftエンタープライズ アイデンティティ ソリューション',
      'Microsoftセキュリティ ソリューション',
      'Microsoftコンプライアンス ソリューション',
    ],
    questionCount: 40,
    passingScore: 700,
  },
  {
    id: 'dp-900',
    name: 'DP-900',
    fullName: 'Microsoft Azure Data Fundamentals',
    description: 'Azureのデータサービスの基礎概念を証明する資格。データ関連の職種を目指す方に最適です。',
    icon: '📊',
    color: 'orange',
    sections: [
      'コアデータの概念',
      'Azureのリレーショナルデータ',
      'Azureの非リレーショナルデータ',
      'Azureの分析ワークロード',
    ],
    questionCount: 40,
    passingScore: 700,
  },
]

export const getExam = (id: string): Exam | undefined =>
  EXAMS.find((e) => e.id === id)
