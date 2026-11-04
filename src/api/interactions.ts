import { sarvamClient } from './sarvamClient'
import { PaginatedResponse, Interaction } from '../types'
import { toISTParam } from '../utils/dateUtils'

export interface FetchInteractionsParams {
  start: Date
  end: Date
  limit?: number
  offset?: number
  includeTranscript?: boolean
}

export async function fetchInteractions(
  params: FetchInteractionsParams
): Promise<PaginatedResponse<Interaction>> {
  const { start, end, limit = 1000, offset = 0, includeTranscript = false } = params
  const { data } = await sarvamClient.get('/interactions', {
    params: {
      start_datetime: toISTParam(start),
      end_datetime: toISTParam(end),
      limit,
      offset,
      sort_by: 'created_at',
      sort_order: 'desc',
      ...(includeTranscript ? { include_transcript: true } : {}),
    },
  })
  return data
}
