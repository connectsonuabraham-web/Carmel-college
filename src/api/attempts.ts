import { sarvamClient } from './sarvamClient'
import { PaginatedResponse, Attempt } from '../types'
import { toISTParam } from '../utils/dateUtils'

export interface FetchAttemptsParams {
  start: Date
  end: Date
  limit?: number
  offset?: number
}

export async function fetchAttempts(
  params: FetchAttemptsParams
): Promise<PaginatedResponse<Attempt>> {
  const { start, end, limit = 1000, offset = 0 } = params
  const { data } = await sarvamClient.get('/attempts', {
    params: {
      start_datetime: toISTParam(start),
      end_datetime: toISTParam(end),
      limit,
      offset,
      sort_by: 'created_at',
      sort_order: 'desc',
    },
  })
  return data
}
