import { useQuery } from '@tanstack/react-query'
import { fetchRecording } from '../api/recordings'

export function useRecording(interactionId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['recording', interactionId],
    queryFn: () => fetchRecording(interactionId!),
    enabled: !!interactionId && enabled,
    staleTime: Infinity,   // blob URLs don't expire — don't re-fetch
    gcTime: 600000,        // keep in cache for 10 minutes
    retry: false,          // don't retry 404s (call has no recording)
  })
}
