import { useQuery } from '@tanstack/react-query'
import { fetchTranscript } from '../api/transcripts'

export function useTranscript(interactionId: string | null) {
  return useQuery({
    queryKey: ['transcript', interactionId],
    queryFn: () => fetchTranscript(interactionId!),
    enabled: !!interactionId,
    staleTime: 300000,
  })
}
