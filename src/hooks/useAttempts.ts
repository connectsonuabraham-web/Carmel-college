import { useQuery } from '@tanstack/react-query'
import { fetchAttempts } from '../api/attempts'
import { DateRange } from '../types'

export function useAttempts(dateRange: DateRange) {
  return useQuery({
    queryKey: ['attempts', dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: () => fetchAttempts({ start: dateRange.start, end: dateRange.end }),
    refetchInterval: 62000,
    refetchIntervalInBackground: true,
    staleTime: 0,
    gcTime: 120000,
  })
}
