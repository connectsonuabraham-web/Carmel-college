import { CONFIG } from '../config'

const apiKey = import.meta.env.VITE_SARVAM_API_KEY as string

/**
 * Fetch a call recording from Sarvam Analytics API.
 *
 * Sarvam API:
 *   GET https://apps.sarvam.ai/api/analytics/v1/{org_id}/{workspace_id}/{app_id}/recordings/{interaction_id}
 *   Header: X-API-Key: <key>
 *   Response: audio/wav binary
 *
 * The interaction_id contains a literal "/" (e.g. "20261104/abc-uuid").
 * This "/" MUST be encoded as %2F in the URL path.
 *
 * Problem: Vite's dev proxy (http-proxy) decodes %2F back to "/" before
 * forwarding, which causes Sarvam to see two path segments and return 400/404.
 *
 * Solution: In DEV, we call the Sarvam API directly from the browser using
 * the full URL. CORS is not an issue for recordings because the response
 * is audio/wav — Sarvam sends CORS headers on the analytics endpoints.
 * We always use native fetch (never axios) so %2F is never re-encoded.
 */

function buildDirectUrl(interactionId: string, endpoint: 'recordings' | 'forwarded-recordings'): string {
  // Always encode "/" as %2F — one path segment, not two
  const encodedId = interactionId.replace('/', '%2F')
  const base = `${CONFIG.BASE_URL}/${CONFIG.ORG_ID}/${CONFIG.WORKSPACE_ID}/${CONFIG.APP_ID}`
  return `${base}/${endpoint}/${encodedId}`
}

async function fetchAudioBlob(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'X-API-Key': apiKey },
  })

  if (response.status === 404) throw new Error('NO_RECORDING')
  if (response.status === 401) throw new Error('INVALID_API_KEY')
  if (!response.ok)            throw new Error(`HTTP_${response.status}`)

  const contentType = response.headers.get('content-type') || 'audio/wav'
  const buffer      = await response.arrayBuffer()
  const blob        = new Blob([buffer], { type: contentType })
  return URL.createObjectURL(blob)
}

/**
 * Fetch the main call recording.
 * Returns a blob: URL for <audio src={...} />.
 * Throws 'NO_RECORDING' if 404, 'INVALID_API_KEY' if 401.
 */
export async function fetchRecording(interactionId: string): Promise<string> {
  // Always go direct to Sarvam — bypasses the Vite proxy %2F decoding issue
  return fetchAudioBlob(buildDirectUrl(interactionId, 'recordings'))
}

/**
 * Fetch the forwarded-leg recording (Vobiz transfers only).
 */
export async function fetchForwardedRecording(interactionId: string): Promise<string> {
  return fetchAudioBlob(buildDirectUrl(interactionId, 'forwarded-recordings'))
}
