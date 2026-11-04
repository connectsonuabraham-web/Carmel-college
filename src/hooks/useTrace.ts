import { useQuery } from '@tanstack/react-query'
import { fetchTrace } from '../api/traces'

export function useTrace(interactionId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['trace', interactionId],
    queryFn: () => fetchTrace(interactionId!),
    enabled: !!interactionId && enabled,
    staleTime: 300000,
  })
}
