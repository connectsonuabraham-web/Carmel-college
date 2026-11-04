import axios from 'axios'
import { CONFIG } from '../config'

// Express server (server.js) proxies /api/sarvam/* → Sarvam analytics API
// API key is injected server-side — never exposed in the browser
const baseURL = `/api/sarvam/${CONFIG.ORG_ID}/${CONFIG.WORKSPACE_ID}/${CONFIG.APP_ID}`

export const sarvamClient = axios.create({ baseURL })

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
