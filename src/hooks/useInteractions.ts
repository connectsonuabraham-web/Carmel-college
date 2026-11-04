import { useQuery } from '@tanstack/react-query'
import { fetchInteractions } from '../api/interactions'
import { DateRange } from '../types'

export function useInteractions(dateRange: DateRange, includeTranscript = false) {
  return useQuery({
    queryKey: ['interactions', dateRange.start.toISOString(), dateRange.end.toISOString(), includeTranscript],
    queryFn: () => fetchInteractions({ start: dateRange.start, end: dateRange.end, includeTranscript }),
    refetchInterval: 62000,   // poll every 62s (Sarvam cache is 60s, so this always hits fresh data)
    refetchIntervalInBackground: true,
    staleTime: 0,             // always consider data stale so manual refetch works instantly
    gcTime: 120000,
  })
}
