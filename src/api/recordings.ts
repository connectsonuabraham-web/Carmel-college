/**
 * Fetch a call recording via the dedicated /api/recording endpoint.
 *
 * The server builds the exact Sarvam curl format:
 *   GET https://apps.sarvam.ai/api/analytics/v1/{org}/{ws}/{app}/recordings/{interaction_id}
 *   -H "X-API-Key: sk_aestf8eu_yWovruzA9d6mwtWIBjTMP3Q1"
 *
 * The interaction_id is passed as a query param so the server can
 * encodeURIComponent it correctly — avoiding the Express %2F decode problem.
 */

async function fetchAudioBlob(interactionId: string, endpoint: 'recording' | 'forwarded-recording' = 'recording'): Promise<string> {
  // Pass interaction_id as a query param — server handles encoding correctly
  const url = `/api/${endpoint}?id=${encodeURIComponent(interactionId)}`

  const response = await fetch(url)

  if (response.status === 404) throw new Error('NO_RECORDING')
  if (response.status === 401) throw new Error('INVALID_API_KEY')
  if (!response.ok) {
    let detail = `HTTP_${response.status}`
    try { const j = await response.json(); detail = j.error || detail } catch (_) {}
    throw new Error(detail)
  }

  const contentType = response.headers.get('content-type') || 'audio/wav'
  const buffer      = await response.arrayBuffer()
  return URL.createObjectURL(new Blob([buffer], { type: contentType }))
}

export async function fetchRecording(interactionId: string): Promise<string> {
  return fetchAudioBlob(interactionId, 'recording')
}

export async function fetchForwardedRecording(interactionId: string): Promise<string> {
  return fetchAudioBlob(interactionId, 'forwarded-recording')
}
