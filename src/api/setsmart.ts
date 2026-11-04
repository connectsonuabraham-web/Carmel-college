import { setsmartFetch, setsmartPost } from './setsmartClient'

export interface Lead {
  contact_id: number
  number: string
  name: string
  email: string
  clientName: string
  status: string
  step: string
  tags: string[]
  custom_fields: Record<string, unknown>
  assistant_id: string
  qualified: string
  ok_call: string
  booked_call: string
  answered: string
  situation: string
  objective: string
  importedAt: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  type: string
  sent_by: string | null
}

export interface Conversation {
  id: number
  channel: string
  contact: { name: string; email: string; phone: string; instagram_username: string | null }
  qualification: { qualified: boolean; ok_call: boolean; answered: boolean; booked: boolean; status: string | null; age: string | null; occupation: string; objective: string; availability: string; business_situation: string; other_qualification_criteria: string }
  tags: string[]
  notes: string | null
  custom_fields: Record<string, unknown>
  ad_referral: unknown
  assistant_id: string
  message_count: number
  messages: Message[]
  updated_at: string
}

export interface ConversationsResponse {
  success: boolean
  total: number
  page: number
  limit: number
  has_more: boolean
  conversations: Conversation[]
}

export async function fetchLeads(): Promise<Lead[]> {
  const data = await setsmartFetch('/leads')
  return Array.isArray(data) ? data as Lead[] : []
}

export async function fetchConversations(page = 1, limit = 50): Promise<ConversationsResponse> {
  const data = await setsmartFetch(`/export-conversations&page=${page}&limit=${limit}`)
  const d = data as Record<string, unknown>
  return { success: true, total: 0, page: 1, limit: 50, has_more: false, conversations: [], ...d }
}

export async function fetchResumeLeads(): Promise<Lead[]> {
  const data = await setsmartFetch('/resume')
  return Array.isArray(data) ? data as Lead[] : []
}

export async function fetchOkCalls(): Promise<Lead[]> {
  const data = await setsmartFetch('/ok-call')
  return Array.isArray(data) ? data as Lead[] : []
}

export async function fetchAiOffLeads(): Promise<Lead[]> {
  const data = await setsmartFetch('/ai-off')
  return Array.isArray(data) ? data as Lead[] : []
}

export async function setBooked(contactId: number | string): Promise<{ success: boolean; message: string }> {
  return setsmartPost('/set-booked', { contact_id: contactId }) as Promise<{ success: boolean; message: string }>
}

export async function setSold(contactId: number | string): Promise<{ success: boolean; message: string }> {
  return setsmartPost('/set-sold', { contact_id: contactId }) as Promise<{ success: boolean; message: string }>
}

export async function addNotes(contactId: number | string, notes: string): Promise<{ success: boolean }> {
  return setsmartPost('/add-notes', { contact_id: contactId, notes }) as Promise<{ success: boolean }>
}

export async function sendTemplate(phone: string, templateName: string, variables: Record<string, string> = {}): Promise<{ success: boolean; message: string }> {
  return setsmartPost('/send-template', { phone, template_name: templateName, template_variables: variables }) as Promise<{ success: boolean; message: string }>
}

export async function updateCustomFields(contactId: number | string, fields: Record<string, unknown>): Promise<{ success: boolean }> {
  return setsmartPost('/update-custom-fields', { contact_id: contactId, custom_fields: fields }) as Promise<{ success: boolean }>
}

// Legacy aliases for backward compatibility
export const fetchSetSmartLeads = fetchLeads
export const fetchSetSmartOkCalls = fetchOkCalls
export const fetchSetSmartResume = fetchResumeLeads
export const fetchSetSmartAiOff = fetchAiOffLeads
export const fetchSetSmartAnsweredLeads = fetchResumeLeads
export const fetchSetSmartFailedMessages = async (): Promise<Lead[]> => []
export const fetchSetSmartConversations = async (): Promise<Conversation[]> => {
  const r = await fetchConversations()
  return r.conversations
}
export const fetchSetSmartUsage = async (): Promise<Record<string, unknown>> => ({})
