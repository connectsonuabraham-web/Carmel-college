import { setsmartFetch } from './setsmartClient'
import type { SetSmartLead, SetSmartUsage } from '../types/setsmart'

export async function fetchSetSmartLeads(): Promise<SetSmartLead[]> {
  const data = await setsmartFetch('/leads')
  return Array.isArray(data) ? data : []
}

export async function fetchSetSmartAnsweredLeads(): Promise<SetSmartLead[]> {
  const data = await setsmartFetch('/answered-leads')
  return Array.isArray(data) ? data : []
}

export async function fetchSetSmartOkCalls(): Promise<SetSmartLead[]> {
  const data = await setsmartFetch('/ok-call')
  return Array.isArray(data) ? data : []
}

export async function fetchSetSmartResume(): Promise<SetSmartLead[]> {
  const data = await setsmartFetch('/resume')
  return Array.isArray(data) ? data : []
}

export async function fetchSetSmartFailedMessages(): Promise<SetSmartLead[]> {
  const data = await setsmartFetch('/failed-messages')
  return Array.isArray(data) ? data : []
}

export async function fetchSetSmartAiOff(): Promise<SetSmartLead[]> {
  const data = await setsmartFetch('/ai-off')
  return Array.isArray(data) ? data : []
}

export async function fetchSetSmartUsage(): Promise<SetSmartUsage> {
  const data = await setsmartFetch('/agency/usage')
  return (data && typeof data === 'object' && !Array.isArray(data)) ? data as SetSmartUsage : {}
}

export async function fetchSetSmartConversations(): Promise<SetSmartLead[]> {
  const data = await setsmartFetch('/conversations')
  return Array.isArray(data) ? data : []
}
