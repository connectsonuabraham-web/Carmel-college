import { Transcript } from '../types'

/**
 * Fetch transcript via dedicated /api/transcript?id= endpoint.
 * Uses query param to avoid Express path-decoding of %2F in interaction_id.
 */
export async function fetchTranscript(interactionId: string): Promise<Transcript> {
  const res = await fetch(`/api/transcript?id=${encodeURIComponent(interactionId)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
