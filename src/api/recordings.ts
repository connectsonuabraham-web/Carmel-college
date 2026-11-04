import { CONFIG } from '../config'

/**
 * Fetch a call recording via the Express proxy.
 *
 * The Express server proxies /api-proxy/* → https://apps.sarvam.ai/api/analytics/v1/*
 * and injects the X-API-Key header server-side, so no key is exposed in the browser.
 *
 * The interaction_id contains a "/" (e.g. "20261104/abc-uuid").
 * We encode it as %2F — Express / http-proxy-middleware preserves it correctly
 * (unlike the old Vite dev proxy which decoded it back to "/").
 */

function buildUrl(interactionId: string, endpoint: 'recordings' | 'forwarded-recordings'): string {
  const encodedId = interactionId.replace('/', '%2F')
  return `/api-proxy/${CONFIG.ORG_ID}/${CONFIG.WORKSPACE_ID}/${CONFIG.APP_ID}/${endpoint}/${encodedId}`
}

async function fetchAudioBlob(url: string): Promise<string> {
  const response = await fetch(url)   // no API key header needed — proxy adds it

  if (response.status === 404) throw new Error('NO_RECORDING')
  if (response.status === 401) throw new Error('INVALID_API_KEY')
  if (!response.ok)            throw new Error(`HTTP_${response.status}`)

  const contentType = response.headers.get('content-type') || 'audio/wav'
  const buffer      = await response.arrayBuffer()
  const blob        = new Blob([buffer], { type: contentType })
  return URL.createObjectURL(blob)
}

export async function fetchRecording(interactionId: string): Promise<string> {
  return fetchAudioBlob(buildUrl(interactionId, 'recordings'))
}

export async function fetchForwardedRecording(interactionId: string): Promise<string> {
  return fetchAudioBlob(buildUrl(interactionId, 'forwarded-recordings'))
}
