import axios from 'axios'
import { CONFIG } from '../config'

// The Express server (server.js) proxies /api-proxy/* to Sarvam, injecting
// the API key server-side. This works in both dev and production — no more
// DEV/PROD switch needed. The key never appears in browser network requests.
const baseURL = `/api-proxy/${CONFIG.ORG_ID}/${CONFIG.WORKSPACE_ID}/${CONFIG.APP_ID}`

export const sarvamClient = axios.create({ baseURL })

// Retry on 429 with Retry-After
sarvamClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after'] ?? '5', 10)
      await new Promise(r => setTimeout(r, retryAfter * 1000))
      return sarvamClient.request(error.config)
    }
    return Promise.reject(error)
  }
)
