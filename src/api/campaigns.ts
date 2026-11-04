import axios from 'axios'
import { PaginatedResponse, Campaign } from '../types'

const apiKey = import.meta.env.VITE_SARVAM_API_KEY as string

const campaignsClient = axios.create({
  baseURL: import.meta.env.DEV ? '/campaigns-proxy' : 'https://apps.sarvam.ai/api/scheduling/v1/orgs/01a02774-5a8e-7417-83b2-bcd5ec5b0a93/workspaces/01a02774-5a93-78e1-88df-42475fe29aa0',
  headers: { 'X-API-Key': apiKey },
})

campaignsClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after'] ?? '5', 10)
      await new Promise((r) => setTimeout(r, retryAfter * 1000))
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
  const { data } = await campaignsClient.get('/campaigns', {
    params: {
      limit: 100,
      sort_by: 'created_at',
      sort_order: 'desc',
      ...params,
    },
  })
  return data
}

export async function fetchCampaign(campaignId: string): Promise<Campaign> {
  const { data } = await campaignsClient.get(`/campaigns/${campaignId}`)
  return data
}
