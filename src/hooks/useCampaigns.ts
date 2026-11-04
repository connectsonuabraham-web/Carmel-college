import { useQuery } from '@tanstack/react-query'
import { fetchCampaigns, FetchCampaignsParams } from '../api/campaigns'

export function useCampaigns(params: FetchCampaignsParams = {}) {
  return useQuery({
    queryKey: ['campaigns', params],
    queryFn: () => fetchCampaigns(params),
    refetchInterval: 60000,
    staleTime: 55000,
  })
}
