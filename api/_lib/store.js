'use strict'
/**
 * Call store — uses Vercel KV (Redis) when available, in-memory otherwise.
 *
 * Vercel KV env vars are auto-injected when you add a KV database in the
 * Vercel dashboard: Storage → Create → KV → Connect to Project.
 * Required vars: KV_REST_API_URL, KV_REST_API_TOKEN
 */

const KV_KEY     = 'sarvam_calls'
const MAX_STORED = 500   // keep last 500 calls

// ── In-memory fallback (used when KV env vars are not set) ───────────────────
// NOTE: on Vercel serverless, memory resets on every cold start.
// Always set up Vercel KV for production persistence.
const memStore = []
const memMap   = new Map()

function hasKV() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

// ── KV operations using REST API directly (no SDK needed, avoids ESM issues) ─
async function kvGet(key) {
  const url   = `${process.env.KV_REST_API_URL}/get/${key}`
  const token = process.env.KV_REST_API_TOKEN
  const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) return null
  const json = await res.json()
  return json.result ? JSON.parse(json.result) : null
}

async function kvSet(key, value) {
  const url   = `${process.env.KV_REST_API_URL}/set/${key}`
  const token = process.env.KV_REST_API_TOKEN
  await fetch(url, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(JSON.stringify(value)),  // KV stores strings
  })
}

// ── Public API ────────────────────────────────────────────────────────────────
async function loadCalls() {
  if (!hasKV()) return [...memStore]
  try {
    const data = await kvGet(KV_KEY)
    return Array.isArray(data) ? data : []
  } catch (e) {
    console.error('[store] KV load failed:', e.message)
    return []
  }
}

async function storeCall(normalised) {
  const id = normalised.interaction_id

  if (!hasKV()) {
    if (memMap.has(id)) return false
    memMap.set(id, normalised)
    memStore.unshift(normalised)
    if (memStore.length > MAX_STORED) memStore.splice(MAX_STORED)
    return true
  }

  try {
    const list = await loadCalls()
    if (list.some(c => c.interaction_id === id)) return false  // duplicate
    list.unshift(normalised)
    await kvSet(KV_KEY, list.slice(0, MAX_STORED))
    return true
  } catch (e) {
    console.error('[store] storeCall failed:', e.message)
    return false
  }
}

// ── Payload normaliser ────────────────────────────────────────────────────────
function normalise(raw) {
  const v  = raw.final_agent_variables  || {}
  const ov = raw.output_agent_variables || {}
  return {
    interaction_id:         raw.interaction_id,
    app_id:                 raw.app_id            ?? null,
    app_version:            raw.app_version        ?? null,
    deployment_id:          raw.deployment_id      ?? null,
    user_phone_number:      raw.user_phone_number  ?? null,
    agent_phone_number:     raw.agent_phone_number ?? null,
    duration:               raw.duration           ?? null,
    start_datetime:         raw.start_datetime     ?? null,
    end_datetime:           raw.end_datetime       ?? null,
    recording_url:          raw.recording_url      ?? null,
    final_agent_variables:  v,
    output_agent_variables: ov,
    call_summary:           v.call_summary         ?? ov.call_summary         ?? null,
    call_disposition:       v.call_disposition     ?? ov.call_disposition     ?? null,
    caller_name:            v.caller_name          ?? v.customer_name         ?? null,
    course_interested_in:   v.course_interested_in ?? null,
    human_transfer_needed:  v.human_transfer_needed ?? null,
    lead_status:            v.lead_status          ?? v.call_outcome          ?? null,
    interaction_transcript: Array.isArray(raw.interaction_transcript) ? raw.interaction_transcript : null,
    metadata:               raw.metadata           ?? null,
    received_at:            new Date().toISOString(),
  }
}

module.exports = { loadCalls, storeCall, normalise, hasKV }
