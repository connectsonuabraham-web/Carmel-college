'use strict'
/**
 * Vercel KV store helpers — shared across all API functions.
 * Falls back to an in-memory Map when KV is not configured (local dev).
 */

const KV_KEY      = 'calls'
const MAX_STORED  = 2000

// ── Determine if Vercel KV is available ──────────────────────────────────────
function hasKV() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

// ── In-memory fallback (local dev only) ──────────────────────────────────────
const memStore = []
const memMap   = new Map()

// ── Load all calls ────────────────────────────────────────────────────────────
async function loadCalls() {
  if (!hasKV()) return [...memStore]
  try {
    const { kv } = await import('@vercel/kv')
    const data = await kv.get(KV_KEY)
    return Array.isArray(data) ? data : []
  } catch { return [] }
}

// ── Save all calls ────────────────────────────────────────────────────────────
async function saveCalls(list) {
  if (!hasKV()) return
  try {
    const { kv } = await import('@vercel/kv')
    await kv.set(KV_KEY, list.slice(0, MAX_STORED))
  } catch (e) { console.error('[store] KV save failed:', e.message) }
}

// ── Store one call — returns true if new, false if duplicate ──────────────────
async function storeCall(normalised) {
  const id = normalised.interaction_id

  if (!hasKV()) {
    if (memMap.has(id)) return false
    memMap.set(id, normalised)
    memStore.unshift(normalised)
    if (memStore.length > MAX_STORED) memStore.splice(MAX_STORED)
    return true
  }

  const list = await loadCalls()
  if (list.some(c => c.interaction_id === id)) return false  // duplicate

  list.unshift(normalised)
  await saveCalls(list)
  return true
}

// ── Normalise any Sarvam webhook payload to a common shape ───────────────────
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
    call_summary:           v.call_summary          ?? ov.call_summary          ?? null,
    call_disposition:       v.call_disposition      ?? ov.call_disposition      ?? null,
    caller_name:            v.caller_name           ?? v.customer_name          ?? null,
    course_interested_in:   v.course_interested_in  ?? null,
    human_transfer_needed:  v.human_transfer_needed ?? null,
    lead_status:            v.lead_status           ?? v.call_outcome           ?? null,
    interaction_transcript: Array.isArray(raw.interaction_transcript) ? raw.interaction_transcript : null,
    metadata:               raw.metadata            ?? null,
    received_at:            new Date().toISOString(),
  }
}

module.exports = { loadCalls, saveCalls, storeCall, normalise, hasKV }
