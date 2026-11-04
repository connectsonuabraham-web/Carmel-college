import axios from 'axios'
import { PaginatedResponse, Campaign } from '../types'

// Routes through /api/campaigns/* → Vercel serverless → Sarvam
// API key is injected server-side
const campaignsClient = axios.create({ baseURL: '/api/campaigns' })

campaignsClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after'] ?? '5', 10)
      await new Promise(r => setTimeout(r, retryAfter * 1000))
      return campaignsClient.request(error.config)
    }
    return Promise.reject(error)
  }
)

export interface FetchCampaignsParams {
  campaign_status?: 'scheduled' | 'active' | 'ended' | 'paused' | 'cancelled'
  limit?: number
  offset?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  search?: string
}

export async function fetchCampaigns(params: FetchCampaignsParams = {}): Promise<PaginatedResponse<Campaign>> {
  const { data } = await campaignsClient.get('/campaigns', { params: { limit: 100, sort_order: 'desc', ...params } })
  return data
}

export async function fetchCampaign(campaignId: string): Promise<Campaign> {
  const { data } = await campaignsClient.get(`/campaigns/${campaignId}`)
  return data
}
