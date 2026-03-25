import { CosmosClient } from '@azure/cosmos'
import { QuizResult } from '@/types'

function createCosmosClient() {
  return new CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT!,
    key: process.env.COSMOS_KEY!,
  })
}

const DATABASE_ID = process.env.COSMOS_DATABASE || 'certcoach'
const RESULTS_CONTAINER = 'quiz-results'

export async function saveQuizResult(result: QuizResult): Promise<void> {
  const client = createCosmosClient()
  const container = client.database(DATABASE_ID).container(RESULTS_CONTAINER)
  await container.items.create({ ...result, id: `${result.userId}_${result.timestamp}` })
}

export async function getQuizResults(
  userId: string,
  examId: string
): Promise<QuizResult[]> {
  const client = createCosmosClient()
  const container = client.database(DATABASE_ID).container(RESULTS_CONTAINER)

  const { resources } = await container.items
    .query({
      query: 'SELECT * FROM c WHERE c.userId = @userId AND c.examId = @examId ORDER BY c.timestamp DESC',
      parameters: [
        { name: '@userId', value: userId },
        { name: '@examId', value: examId },
      ],
    })
    .fetchAll()

  return resources as QuizResult[]
}
