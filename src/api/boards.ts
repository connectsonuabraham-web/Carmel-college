import axios from 'axios'
import { Board, TabRunResult } from '../types'

const boardsClient = axios.create({ baseURL: '/api/boards' })

boardsClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after'] ?? '5', 10)
      await new Promise(r => setTimeout(r, retryAfter * 1000))
      return boardsClient.request(error.config)
    }
    return Promise.reject(error)
  }
)

export async function fetchBoards(): Promise<Board[]> {
  const { data } = await boardsClient.get('/')
  return Array.isArray(data) ? data : (data.items ?? [])
}
export async function fetchBoard(boardId: string): Promise<Board> {
  const { data } = await boardsClient.get(`/${boardId}`)
  return data
}
export async function runBoardTab(boardId: string, tabId: string, filterValues: Record<string, string> = {}): Promise<TabRunResult> {
  const { data } = await boardsClient.post(`/${boardId}/tabs/${tabId}/run`, { filter_values: filterValues })
  return data
}
