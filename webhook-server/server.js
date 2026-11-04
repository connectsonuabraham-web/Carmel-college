/**
 * Sarvam Voice Agent — Webhook Receiver
 * ══════════════════════════════════════
 * Public URL: https://darkslategray-giraffe-469443.hostingersite.com
 *
 * POST /webhook/call      ← Sarvam posts here after every call
 * GET  /webhook/calls     ← Dashboard polls for stored calls
 * GET  /events            ← SSE stream — dashboard gets instant push
 * GET  /health            ← Health check
 *
 * No npm dependencies — pure Node.js stdlib only.
 * Reads config from .env in the same folder.
 *
 * Start:  node server.js
 * PM2:    pm2 start server.js --name sarvam-webhook
 */

'use strict'

// ── Load .env (no dotenv package needed — pure Node.js) ──────────────────────
const fs   = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '.env')
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach(line => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return
      const eq = trimmed.indexOf('=')
      if (eq === -1) return
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (key && !(key in process.env)) process.env[key] = val
    })
}

const http   = require('http')
const crypto = require('crypto')
// fs and path already required above for .env loading

// ── Config ──────────────────────────────────────────────────────────────────
const PORT           = Number(process.env.WEBHOOK_PORT)  || 3001
const PUBLIC_URL     = 'https://darkslategray-giraffe-469443.hostingersite.com'
const DATA_FILE      = path.join(__dirname, 'calls.json')
const MAX_STORED     = 2000
// Optional shared secret — set WEBHOOK_SECRET env var on the server.
// If set, every POST must include it in metadata.secret OR X-Webhook-Secret header.
const SHARED_SECRET  = process.env.WEBHOOK_SECRET || null

// ── Persistent store ─────────────────────────────────────────────────────────
/** @type {Map<string, object>} interaction_id → normalised call */
const callsMap  = new Map()   // for O(1) dedup lookup
let   callsList = []          // ordered newest-first, for pagination

function loadFromDisk() {
  if (!fs.existsSync(DATA_FILE)) return
  try {
    const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    if (Array.isArray(saved)) {
      saved.forEach(c => { if (c.interaction_id) callsMap.set(c.interaction_id, c) })
      callsList = saved
      console.log(`[store] Loaded ${callsList.length} calls from disk`)
    }
  } catch (e) {
    console.warn('[store] Could not parse calls.json, starting fresh:', e.message)
  }
}

let persistTimer = null
function schedulePersist() {
  // Debounce — write at most once per 2 seconds
  if (persistTimer) return
  persistTimer = setTimeout(() => {
    persistTimer = null
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(callsList.slice(0, MAX_STORED), null, 2))
    } catch (e) {
      console.error('[store] Failed to persist:', e.message)
    }
  }, 2000)
}

function storeCall(normalised) {
  const id = normalised.interaction_id
  if (callsMap.has(id)) return false  // duplicate — skip

  callsMap.set(id, normalised)
  callsList.unshift(normalised)       // newest first
  if (callsList.length > MAX_STORED) {
    const removed = callsList.splice(MAX_STORED)
    removed.forEach(c => callsMap.delete(c.interaction_id))
  }
  schedulePersist()
  return true  // was new
}

// ── SSE broadcaster ───────────────────────────────────────────────────────────
const sseClients = new Set()

function broadcast(eventName, data) {
  const frame = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`
  for (const res of [...sseClients]) {
    try   { res.write(frame) }
    catch { sseClients.delete(res) }
  }
}

// ── Async processing queue (store first, process later) ───────────────────────
const queue = []
let processing = false

function enqueue(task) {
  queue.push(task)
  if (!processing) drainQueue()
}

async function drainQueue() {
  processing = true
  while (queue.length > 0) {
    const task = queue.shift()
    try { await task() } catch (e) { console.error('[queue] task error:', e.message) }
  }
  processing = false
}

// ── Payload normaliser ────────────────────────────────────────────────────────
function normalise(raw) {
  const vars     = raw.final_agent_variables  || {}
  const outVars  = raw.output_agent_variables || {}
  return {
    // Identity
    interaction_id:   raw.interaction_id,
    app_id:           raw.app_id           ?? null,
    app_version:      raw.app_version      ?? null,
    deployment_id:    raw.deployment_id    ?? null,

    // Parties
    user_phone_number:  raw.user_phone_number  ?? null,
    agent_phone_number: raw.agent_phone_number ?? null,

    // Timing
    duration:        raw.duration       ?? null,
    start_datetime:  raw.start_datetime ?? null,
    end_datetime:    raw.end_datetime   ?? null,

    // Recording — store URL as-is; null if not recorded
    recording_url:   raw.recording_url  ?? null,

    // Agent variables — keep everything, null-safe
    final_agent_variables:  vars   ,
    output_agent_variables: outVars,

    // Promoted fields for quick table display (null if not present)
    call_summary:           vars.call_summary             ?? outVars.call_summary             ?? null,
    call_disposition:       vars.call_disposition         ?? outVars.call_disposition         ?? null,
    caller_name:            vars.caller_name              ?? vars.customer_name               ?? null,
    course_interested_in:   vars.course_interested_in     ?? null,
    human_transfer_needed:  vars.human_transfer_needed    ?? null,
    lead_status:            vars.lead_status              ?? vars.call_outcome                ?? null,

    // Transcript — full array, null if not present
    interaction_transcript: Array.isArray(raw.interaction_transcript)
      ? raw.interaction_transcript
      : null,

    // Metadata echoed back by Sarvam
    metadata: raw.metadata ?? null,

    // Server-side housekeeping
    received_at:  new Date().toISOString(),
    webhook_src:  'sarvam',
  }
}

// ── Auth check ────────────────────────────────────────────────────────────────
function isAuthorised(raw, req) {
  if (!SHARED_SECRET) return true   // no secret configured — open
  const fromHeader = req.headers['x-webhook-secret']
  const fromMeta   = raw?.metadata?.secret
  return fromHeader === SHARED_SECRET || fromMeta === SHARED_SECRET
}

// ── Body reader ────────────────────────────────────────────────────────────────
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data',  c => chunks.push(c))
    req.on('end',   () => {
      try   { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) }
      catch { reject(new Error('Body is not valid JSON')) }
    })
    req.on('error', reject)
  })
}

// ── JSON response helpers ────────────────────────────────────────────────────
function json(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) })
  res.end(payload)
}

// ── Required field validator ─────────────────────────────────────────────────
const REQUIRED = ['app_id','app_version','deployment_id','interaction_id','user_phone_number','agent_phone_number']
function validate(raw) {
  const missing = REQUIRED.filter(k => raw[k] == null || raw[k] === '')
  return missing.length ? missing : null
}

// ── Request router ─────────────────────────────────────────────────────────────
async function handleRequest(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Secret, X-API-Key')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  const [urlPath] = req.url.split('?')

  // ── POST /webhook/call  ——————————————————————————————————————————————————
  if (req.method === 'POST' && urlPath === '/webhook/call') {
    let raw
    try   { raw = await readBody(req) }
    catch { return json(res, 400, { error: 'invalid_json', detail: 'Body must be JSON' }) }

    // Auth
    if (!isAuthorised(raw, req)) return json(res, 401, { error: 'unauthorised', detail: 'Bad or missing shared secret' })

    // Validate required fields
    const missing = validate(raw)
    if (missing) return json(res, 400, { error: 'missing_fields', detail: `Required: ${missing.join(', ')}` })

    // Respond 200 immediately — never block the caller
    json(res, 200, { received: true, interaction_id: raw.interaction_id })

    // Enqueue the rest of the work
    enqueue(async () => {
      const normalised = normalise(raw)
      const isNew = storeCall(normalised)

      if (isNew) {
        console.log(`[webhook] NEW  ${normalised.interaction_id} | ${normalised.user_phone_number} | ${normalised.duration ?? '?'}s`)
        broadcast('new_call', normalised)
      } else {
        console.log(`[webhook] DUPE ${normalised.interaction_id} — skipped`)
      }
    })
    return
  }

  // ── Also accept legacy paths from earlier dashboard versions ─────────────
  if (req.method === 'POST' && (urlPath === '/webhook/inbound' || urlPath === '/webhook/campaign' || urlPath === '/webhook/outbound')) {
    let raw
    try   { raw = await readBody(req) }
    catch { return json(res, 400, { error: 'invalid_json' }) }
    json(res, 200, { received: true })
    enqueue(async () => {
      // Map legacy shape to the canonical shape
      const mapped = {
        app_id:           raw.app_id           || 'unknown',
        app_version:      raw.app_version       || 0,
        deployment_id:    raw.deployment_id     || 'unknown',
        interaction_id:   raw.interaction_id    || crypto.randomUUID(),
        user_phone_number:  raw.user_phone_number  || raw.channel_info?.agent_phone_number || 'unknown',
        agent_phone_number: raw.agent_phone_number || raw.channel_info?.agent_phone_number || 'unknown',
        duration:           raw.duration,
        recording_url:      raw.recording_url   ?? null,
        start_datetime:     raw.start_datetime  ?? null,
        end_datetime:       raw.end_datetime    ?? null,
        final_agent_variables:  raw.final_agent_variables  ?? null,
        output_agent_variables: raw.output_agent_variables ?? null,
        interaction_transcript: raw.interaction_transcript ?? null,
        metadata:               raw.metadata               ?? { _src: urlPath },
      }
      const normalised = normalise(mapped)
      if (storeCall(normalised)) broadcast('new_call', normalised)
    })
    return
  }

  // ── GET /webhook/calls  — paginated REST endpoint for the dashboard ───────
  if (req.method === 'GET' && urlPath === '/webhook/calls') {
    const params   = new URLSearchParams(req.url.split('?')[1] || '')
    const limit    = Math.min(parseInt(params.get('limit')  || '100', 10), 1000)
    const offset   = Math.max(parseInt(params.get('offset') || '0',   10), 0)
    const search   = (params.get('search') || '').toLowerCase()
    const dispFilt = (params.get('disposition') || '').toLowerCase()

    let list = callsList
    if (search)   list = list.filter(c =>
      (c.user_phone_number  || '').includes(search) ||
      (c.interaction_id     || '').includes(search) ||
      (c.caller_name        || '').toLowerCase().includes(search) ||
      (c.call_summary       || '').toLowerCase().includes(search)
    )
    if (dispFilt) list = list.filter(c =>
      (c.call_disposition || '').toLowerCase() === dispFilt
    )

    return json(res, 200, {
      total: list.length,
      limit,
      offset,
      items: list.slice(offset, offset + limit),
    })
  }

  // ── GET /events  — SSE stream ──────────────────────────────────────────────
  if (req.method === 'GET' && urlPath === '/events') {
    res.writeHead(200, {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',
    })
    res.write('retry: 3000\n\n')
    // Immediately send the last 50 calls as history
    res.write(`event: history\ndata: ${JSON.stringify(callsList.slice(0, 50))}\n\n`)
    sseClients.add(res)
    console.log(`[SSE] connected — clients: ${sseClients.size}`)
    req.on('close', () => { sseClients.delete(res); console.log(`[SSE] disconnected — clients: ${sseClients.size}`) })
    return
  }

  // ── GET /health ─────────────────────────────────────────────────────────────
  if (req.method === 'GET' && urlPath === '/health') {
    return json(res, 200, {
      status:       'ok',
      domain:       PUBLIC_URL,
      calls_stored: callsList.length,
      sse_clients:  sseClients.size,
      auth:         SHARED_SECRET ? 'secret_required' : 'open',
      uptime_s:     process.uptime().toFixed(0),
    })
  }

  json(res, 404, { error: 'not_found' })
}

// ── Boot ────────────────────────────────────────────────────────────────────────
loadFromDisk()
const server = http.createServer(handleRequest)
server.listen(PORT, () => {
  const W = '═'.repeat(66)
  console.log(`\n╔${W}╗`)
  console.log(`║  Sarvam Webhook Receiver — Carmel College of Nursing        ║`)
  console.log(`╠${W}╣`)
  console.log(`║  Local   http://localhost:${PORT}                                  ║`)
  console.log(`║  Public  ${PUBLIC_URL}  ║`)
  console.log(`╠${W}╣`)
  console.log(`║  Paste into Sarvam Deploy → Webhook config:                 ║`)
  console.log(`║    ${PUBLIC_URL}/webhook/call       ║`)
  console.log(`╠${W}╣`)
  console.log(`║  Other endpoints:                                            ║`)
  console.log(`║    GET  /webhook/calls   paginated call list (JSON)         ║`)
  console.log(`║    GET  /events          SSE stream for dashboard           ║`)
  console.log(`║    GET  /health          status check                       ║`)
  console.log(`╠${W}╣`)
  console.log(`║  Auth: ${SHARED_SECRET ? 'SHARED_SECRET set — requests must include it' : 'open (set WEBHOOK_SECRET env var to enable)      '}  ║`)
  console.log(`╚${W}╝\n`)
})
