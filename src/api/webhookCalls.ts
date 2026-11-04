import { WebhookCallsResponse } from '../types'

export interface FetchWebhookCallsParams {
  limit?:       number
  offset?:      number
  search?:      string
  disposition?: string
}

export async function fetchWebhookCalls(params: FetchWebhookCallsParams = {}): Promise<WebhookCallsResponse> {
  const { limit = 100, offset = 0, search = '', disposition = '' } = params
  const qs = new URLSearchParams()
  qs.set('limit',  String(limit))
  qs.set('offset', String(offset))
  if (search)      qs.set('search',      search)
  if (disposition) qs.set('disposition', disposition)

  const res = await fetch(`/api/webhook/calls?${qs}`)
  if (!res.ok) throw new Error(`Webhook API error: ${res.status}`)
  return res.json() as Promise<WebhookCallsResponse>
}
