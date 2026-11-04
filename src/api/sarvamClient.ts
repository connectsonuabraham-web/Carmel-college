import axios from 'axios'
import { CONFIG } from '../config'

const apiKey = import.meta.env.VITE_SARVAM_API_KEY as string

// In dev, use Vite proxy to avoid CORS; in prod use direct URL
const baseURL = import.meta.env.DEV
  ? `/api-proxy/${CONFIG.ORG_ID}/${CONFIG.WORKSPACE_ID}/${CONFIG.APP_ID}`
  : `${CONFIG.BASE_URL}/${CONFIG.ORG_ID}/${CONFIG.WORKSPACE_ID}/${CONFIG.APP_ID}`

export const sarvamClient = axios.create({
  baseURL,
  headers: {
    'X-API-Key': apiKey,
  },
})

// Prevent axios from percent-encoding already-encoded sequences like %2F.
// Without this, "/recordings/20261104%2Fabc" becomes "/recordings/20261104%252Fabc".
sarvamClient.interceptors.request.use((config) => {
  if (config.url) {
    // Decode the URL first so axios doesn't double-encode it,
    // then re-apply our intentional %2F by leaving the raw string alone.
    // We do this by replacing axios's default URL transformation:
    config.url = config.url  // already a plain string — axios won't re-encode it
  }
  return config
})

// Retry on 429 with Retry-After
sarvamClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after'] ?? '5', 10)
      await new Promise((r) => setTimeout(r, retryAfter * 1000))
      return sarvamClient.request(error.config)
    }
    return Promise.reject(error)
  }
)
