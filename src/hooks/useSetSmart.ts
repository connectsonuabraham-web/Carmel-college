import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchLeads, fetchConversations, fetchResumeLeads, fetchOkCalls, fetchAiOffLeads, setBooked, setSold, addNotes } from '../api/setsmart'

const OPT = { refetchInterval: 30000, staleTime: 0, retry: 1 }

export const useLeads         = () => useQuery({ queryKey: ['ss-leads'],    queryFn: fetchLeads,       ...OPT })
export const useConversations = (page = 1) => useQuery({ queryKey: ['ss-convs', page], queryFn: () => fetchConversations(page), ...OPT })
export const useResumeLeads   = () => useQuery({ queryKey: ['ss-resume'],   queryFn: fetchResumeLeads, ...OPT })
export const useOkCalls       = () => useQuery({ queryKey: ['ss-ok'],       queryFn: fetchOkCalls,     ...OPT })
export const useAiOffLeads    = () => useQuery({ queryKey: ['ss-aioff'],    queryFn: fetchAiOffLeads,  ...OPT })

export function useSetBooked() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: number | string) => setBooked(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['ss-leads'] }) })
}
export function useSetSold() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: (id: number | string) => setSold(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['ss-leads'] }) })
}
export function useAddNotes() {
  return useMutation({ mutationFn: ({ id, notes }: { id: number | string; notes: string }) => addNotes(id, notes) })
}

// Legacy aliases — keep for backwards compatibility with existing pages
export const useSetSmartLeads         = useLeads
export const useSetSmartConversations = () => { const r = useConversations(); return { ...r, data: r.data?.conversations ?? [] } }
export const useSetSmartUsage         = () => ({ data: {} as Record<string, unknown>, isFetching: false, isLoading: false, error: null })
export const useSetSmartAiOff         = useAiOffLeads
export const useSetSmartOkCalls       = useOkCalls
export const useSetSmartAnswered      = useResumeLeads
export const useSetSmartFailed        = () => ({ data: [] as unknown[], isFetching: false, isLoading: false, error: null })
export const useSetSmartResume        = useResumeLeads
