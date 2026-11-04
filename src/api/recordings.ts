import { CONFIG } from '../config'

// Recordings go through /api/sarvam/* Express proxy — API key injected server-side
// Express + http-proxy-middleware correctly preserves %2F in the path
function buildUrl(interactionId: string, endpoint: 'recordings' | 'forwarded-recordings'): string {
  const encodedId = interactionId.replace('/', '%2F')
  return `/api/sarvam/${CONFIG.ORG_ID}/${CONFIG.WORKSPACE_ID}/${CONFIG.APP_ID}/${endpoint}/${encodedId}`
}

async function fetchAudioBlob(url: string): Promise<string> {
  const response = await fetch(url)
  if (response.status === 404) throw new Error('NO_RECORDING')
  if (response.status === 401) throw new Error('INVALID_API_KEY')
  if (!response.ok)            throw new Error(`HTTP_${response.status}`)
  const contentType = response.headers.get('content-type') || 'audio/wav'
  const buffer      = await response.arrayBuffer()
  return URL.createObjectURL(new Blob([buffer], { type: contentType }))
}

export async function fetchRecording(interactionId: string): Promise<string> {
  return fetchAudioBlob(buildUrl(interactionId, 'recordings'))
}

export async function fetchForwardedRecording(interactionId: string): Promise<string> {
  return fetchAudioBlob(buildUrl(interactionId, 'forwarded-recordings'))
}
