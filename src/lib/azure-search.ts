import { SearchClient, AzureKeyCredential } from '@azure/search-documents'

export interface SearchDocument {
  id: string
  exam_id: string
  section: string
  subsection: string
  content: string
  source_url: string
  chunk_index: number
}

export function createSearchClient() {
  const endpoint = process.env.AZURE_SEARCH_ENDPOINT!
  const apiKey = process.env.AZURE_SEARCH_KEY!
  const indexName = process.env.AZURE_SEARCH_INDEX_NAME || 'exam-knowledge'

  return new SearchClient<SearchDocument>(
    endpoint,
    indexName,
    new AzureKeyCredential(apiKey)
  )
}

export async function searchDocuments(
  query: string,
  examId: string,
  topK = 5
): Promise<SearchDocument[]> {
  const client = createSearchClient()

  const results = await client.search(query, {
    filter: `exam_id eq '${examId}'`,
    top: topK,
    select: ['id', 'exam_id', 'section', 'subsection', 'content', 'source_url', 'chunk_index'],
  })

  const docs: SearchDocument[] = []
  for await (const result of results.results) {
    docs.push(result.document)
  }
  return docs
}
