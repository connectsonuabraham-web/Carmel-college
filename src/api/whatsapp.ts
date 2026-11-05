export type WhatsAppRow = Record<string, unknown>
export type WhatsAppResource = 'contacts' | 'conversations' | 'messages' | 'leads'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.message || body.error || `Request failed (${response.status})`)
  return body as T
}
export async function fetchWhatsApp(resource: WhatsAppResource): Promise<WhatsAppRow[]> {
  const result = await request<{data?: WhatsAppRow[]}>(`/api/whatsapp/${resource}`)
  return Array.isArray(result.data) ? result.data : []
}
export async function fetchWhatsAppConfig() {
  return request<{storageConfigured:boolean;sendConfigured:boolean;controlConfigured:boolean}>('/api/whatsapp/config')
}
export async function sendWhatsAppMessage(phone: string, message: string, conversation_id?: string) {
  return request<{success:boolean}>('/api/whatsapp/send', {method:'POST',body:JSON.stringify({phone,message,conversation_id})})
}
export async function controlWhatsAppAI(phone: string, action: 'pause_ai'|'resume_ai', conversation_id?: string) {
  return request<{success:boolean}>('/api/whatsapp/control', {method:'POST',body:JSON.stringify({phone,action,conversation_id})})
}
