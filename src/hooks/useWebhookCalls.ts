import { useQuery } from '@tanstack/react-query'
import { fetchWebhookCalls, FetchWebhookCallsParams } from '../api/webhookCalls'

export function useWebhookCalls(params: FetchWebhookCallsParams = {}) {
  return useQuery({
    queryKey: ['webhook-calls', params],
    queryFn:  () => fetchWebhookCalls(params),
    refetchInterval: 10000,        // poll every 10s for near-instant updates
    refetchIntervalInBackground: true,
    staleTime: 0,
    retry: 2,
  })
}
