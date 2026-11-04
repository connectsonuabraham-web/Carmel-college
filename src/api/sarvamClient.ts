import axios from 'axios'
import { CONFIG } from '../config'

// All Sarvam API calls go through /api/sarvam/* on the same origin.
// The Vercel serverless function at api/sarvam/[...path].js proxies to
// Sarvam and injects the API key server-side.
const baseURL = `/api/sarvam/${CONFIG.ORG_ID}/${CONFIG.WORKSPACE_ID}/${CONFIG.APP_ID}`

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
