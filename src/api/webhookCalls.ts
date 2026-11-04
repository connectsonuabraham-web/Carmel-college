import { WebhookCallsResponse } from '../types'

// Same-origin — Express serves both the React app and the webhook API
const WEBHOOK_BASE = ''

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

  const res = await fetch(`${WEBHOOK_BASE}/webhook/calls?${qs}`)
  if (!res.ok) throw new Error(`Webhook server error: ${res.status}`)
  return res.json() as Promise<WebhookCallsResponse>
}
