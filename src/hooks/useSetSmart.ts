import { useQuery } from '@tanstack/react-query'
import {
  fetchSetSmartLeads, fetchSetSmartAnsweredLeads, fetchSetSmartOkCalls,
  fetchSetSmartUsage, fetchSetSmartAiOff, fetchSetSmartConversations,
  fetchSetSmartFailedMessages, fetchSetSmartResume
} from '../api/setsmart'

const OPT = { refetchInterval: 30000, staleTime: 0, retry: 1 }

export const useSetSmartLeads         = () => useQuery({ queryKey: ['ss-leads'],         queryFn: fetchSetSmartLeads,         ...OPT })
export const useSetSmartAnswered      = () => useQuery({ queryKey: ['ss-answered'],       queryFn: fetchSetSmartAnsweredLeads, ...OPT })
export const useSetSmartOkCalls       = () => useQuery({ queryKey: ['ss-ok'],            queryFn: fetchSetSmartOkCalls,       ...OPT })
export const useSetSmartUsage         = () => useQuery({ queryKey: ['ss-usage'],          queryFn: fetchSetSmartUsage,         ...OPT })
export const useSetSmartAiOff         = () => useQuery({ queryKey: ['ss-aioff'],          queryFn: fetchSetSmartAiOff,         ...OPT })
export const useSetSmartConversations = () => useQuery({ queryKey: ['ss-conversations'],   queryFn: fetchSetSmartConversations, ...OPT })
export const useSetSmartFailed        = () => useQuery({ queryKey: ['ss-failed'],         queryFn: fetchSetSmartFailedMessages,...OPT })
export const useSetSmartResume        = () => useQuery({ queryKey: ['ss-resume'],         queryFn: fetchSetSmartResume,        ...OPT })
