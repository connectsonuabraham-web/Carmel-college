const SETSMART_BASE = '/api/setsmart'

export async function setsmartFetch(path: string): Promise<unknown> {
  const res = await fetch(`${SETSMART_BASE}${path}`)
  if (!res.ok) throw new Error(`SetSmart API ${res.status}`)
  const text = await res.text()
  if (!text || text === '' || text === 'null') return []
  try { return JSON.parse(text) } catch { return [] }
}

export async function setsmartPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${SETSMART_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  try { return JSON.parse(text) } catch { return {} }
}
