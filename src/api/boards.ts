import axios from 'axios'
import { Board, TabRunResult } from '../types'

const apiKey = import.meta.env.VITE_SARVAM_API_KEY as string

const boardsClient = axios.create({
  baseURL: import.meta.env.DEV
    ? '/boards-proxy'
    : 'https://apps.sarvam.ai/api/analytics/v1/01a02774-5a8e-7417-83b2-bcd5ec5b0a93/01a02774-5a93-78e1-88df-42475fe29aa0/boards',
  headers: { 'X-API-Key': apiKey },
})

boardsClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after'] ?? '5', 10)
      await new Promise((r) => setTimeout(r, retryAfter * 1000))
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

export async function runBoardTab(
  boardId: string,
  tabId: string,
  filterValues: Record<string, string> = {}
): Promise<TabRunResult> {
  const { data } = await boardsClient.post(`/${boardId}/tabs/${tabId}/run`, {
    filter_values: filterValues,
  })
  return data
}
