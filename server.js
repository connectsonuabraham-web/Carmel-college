'use strict'

/**
 * Carmel College of Nursing — Sarvam Voice Agent Dashboard
 * ══════════════════════════════════════════════════════════
 *
 * Single Node.js / Express server that does everything:
 *
 *  1. Serves the React app (dist/) as static files
 *  2. Proxies Sarvam API calls to avoid CORS:
 *       /api-proxy/*          → https://apps.sarvam.ai/api/analytics/v1/*
 *       /campaigns-proxy/*    → https://apps.sarvam.ai/api/scheduling/v1/orgs/.../workspaces/.../*
 *       /boards-proxy/*       → https://apps.sarvam.ai/api/analytics/v1/{org}/{ws}/boards/*
 *  3. Webhook receiver — Sarvam POSTs here after every call:
 *       POST /webhook/call
 *       POST /webhook/inbound|campaign|outbound  (legacy)
 *       GET  /webhook/calls    paginated call list
 *       GET  /events           SSE stream
 *       GET  /health
 *
 * Start:   node server.js
 * Deploy:  set PORT env var (default 3001). Build the React app first: npm run build
 */

// ── Load .env ─────────────────────────────────────────────────────────────────
const fs   = require('fs')
const path = require('path')

const envFile = path.join(__dirname, '.env')
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
    const t = line.trim()
    if (!t || t.startsWith('#')) return
    const eq  = t.indexOf('=')
    if (eq < 0) return
    const key = t.slice(0, eq).trim()
    const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (key && !(key in process.env)) process.env[key] = val
  })
}

const express  = require('express')
const crypto   = require('crypto')
// Note: http-proxy-middleware removed — replaced with native fetch proxy below

const app  = express()
const PORT = Number(process.env.PORT) || 3001

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const ORG_ID         = process.env.SARVAM_ORG_ID        || '01a02774-5a8e-7417-83b2-bcd5ec5b0a93'
const WS_ID          = process.env.SARVAM_WORKSPACE_ID  || '01a02774-5a93-78e1-88df-42475fe29aa0'
const APP_ID         = process.env.SARVAM_APP_ID        || 'Conversatio-63a490c9-20af'
const SARVAM_API_KEY = process.env.SARVAM_API_KEY        || process.env.VITE_SARVAM_API_KEY || ''
const SHARED_SECRET  = process.env.WEBHOOK_SECRET        || null
const MAX_STORED     = 2000
const DATA_FILE      = path.join(__dirname, 'calls.json')

// ─────────────────────────────────────────────────────────────────────────────
// In-memory call store (webhook receiver)
// ─────────────────────────────────────────────────────────────────────────────
const callsMap  = new Map()
let   callsList = []

;(function loadFromDisk() {
  if (!fs.existsSync(DATA_FILE)) return
  try {
    const saved = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'))
    if (Array.isArray(saved)) {
      saved.forEach(c => c.interaction_id && callsMap.set(c.interaction_id, c))
      callsList = saved
      console.log(`[store] Loaded ${callsList.length} calls`)
    }
  } catch (e) { console.warn('[store] Could not read calls.json:', e.message) }
})()

let persistTimer = null
function schedulePersist() {
  if (persistTimer) return
  persistTimer = setTimeout(() => {
    persistTimer = null
    try { fs.writeFileSync(DATA_FILE, JSON.stringify(callsList.slice(0, MAX_STORED), null, 2)) }
    catch (e) { console.error('[store] persist failed:', e.message) }
  }, 2000)
}

function storeCall(norm) {
  const id = norm.interaction_id
  if (callsMap.has(id)) return false
  callsMap.set(id, norm)
  callsList.unshift(norm)
  if (callsList.length > MAX_STORED) {
    callsList.splice(MAX_STORED).forEach(c => callsMap.delete(c.interaction_id))
  }
  schedulePersist()
  return true
}

// ─────────────────────────────────────────────────────────────────────────────
// SSE broadcaster
// ─────────────────────────────────────────────────────────────────────────────
const sseClients = new Set()

function broadcast(event, data) {
  const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
  for (const r of [...sseClients]) {
    try   { r.write(frame) }
    catch { sseClients.delete(r) }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Async queue (respond 200 first, process payload after)
// ─────────────────────────────────────────────────────────────────────────────
const queue = []
let   processing = false
function enqueue(task) {
  queue.push(task)
  if (!processing) drain()
}
async function drain() {
  processing = true
  while (queue.length) {
    try { await queue.shift()() } catch (e) { console.error('[queue]', e.message) }
  }
  processing = false
}

// ─────────────────────────────────────────────────────────────────────────────
// Payload normaliser
// ─────────────────────────────────────────────────────────────────────────────
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
    webhook_src:            'sarvam',
  }
}

function isAuthorised(raw, req) {
  if (!SHARED_SECRET) return true
  return req.headers['x-webhook-secret'] === SHARED_SECRET || raw?.metadata?.secret === SHARED_SECRET
}

const REQUIRED = ['app_id','app_version','deployment_id','interaction_id','user_phone_number','agent_phone_number']
function validate(raw) {
  const m = REQUIRED.filter(k => raw[k] == null || raw[k] === '')
  return m.length ? m : null
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Secret, X-API-Key')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

app.use(express.json())

// ─────────────────────────────────────────────────────────────────────────────
// Sarvam API proxy — fetch-based (works on all Node.js hosts)
//
// Routes:
//   /api/sarvam/*       → https://apps.sarvam.ai/api/analytics/v1/*
//   /api/campaigns/*    → https://apps.sarvam.ai/api/scheduling/v1/orgs/{org}/workspaces/{ws}/*
//   /api/boards/*       → https://apps.sarvam.ai/api/analytics/v1/{org}/{ws}/boards/*
//
// The X-API-Key is injected server-side. %2F in recording IDs is preserved
// because we use req.url directly without any re-encoding.
// ─────────────────────────────────────────────────────────────────────────────
async function sarvamFetchProxy(req, res, targetBase) {
  try {
    // Use req.originalUrl to preserve encoded characters like %2F in recording IDs.
    // Express decodes req.url but originalUrl keeps the raw encoded form.
    const rawPath = req.originalUrl.replace(/^\/api\/(sarvam|campaigns|boards|api-proxy)/, '')
    const targetUrl = `${targetBase}${rawPath}`

    console.log(`[proxy] ${req.method} ${targetUrl.slice(0, 100)}`)

    const isRecording = rawPath.includes('/recordings/') || rawPath.includes('/forwarded-recordings/')

    const upstream = await fetch(targetUrl, {
      method:  req.method,
      headers: {
        'X-API-Key':    SARVAM_API_KEY,
        'Content-Type': 'application/json',
        'Accept':       isRecording ? 'audio/wav,audio/*,*/*' : 'application/json',
      },
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    })

    if (upstream.status === 401) {
      console.error('[proxy] 401 — SARVAM_API_KEY is wrong or not set in Hostinger env vars')
    }

    // Forward content-type
    const ct = upstream.headers.get('content-type') || 'application/json'
    res.setHeader('Content-Type', ct)
    res.setHeader('Access-Control-Allow-Origin', '*')

    // For binary responses (recordings), send as buffer
    if (isRecording && upstream.ok) {
      const buf = Buffer.from(await upstream.arrayBuffer())
      return res.status(upstream.status).send(buf)
    }

    // For JSON responses
    const text = await upstream.text()
    res.status(upstream.status).send(text)

  } catch (err) {
    console.error('[proxy] fetch error:', err.message)
    res.status(502).json({ error: 'proxy_error', detail: err.message })
  }
}

// Mount proxy routes
const SARVAM_ANALYTICS  = `https://apps.sarvam.ai/api/analytics/v1`
const SARVAM_SCHEDULING = `https://apps.sarvam.ai/api/scheduling/v1/orgs/${ORG_ID}/workspaces/${WS_ID}`

app.all('/api/sarvam/*',    (req, res) => sarvamFetchProxy(req, res, SARVAM_ANALYTICS))
app.all('/api/campaigns/*', (req, res) => sarvamFetchProxy(req, res, SARVAM_SCHEDULING))
app.all('/api/boards/*',    (req, res) => sarvamFetchProxy(req, res, `${SARVAM_ANALYTICS}/${ORG_ID}/${WS_ID}/boards`))
app.all('/api-proxy/*',     (req, res) => sarvamFetchProxy(req, res, SARVAM_ANALYTICS))

// SetSmart WhatsApp Agent proxy — /api/setsmart/* → https://setsmart.io/api/*
app.all('/api/setsmart/*', async (req, res) => {
  try {
    const suffix = req.originalUrl.replace(/^\/api\/setsmart/, '')
    const sep = suffix.includes('?') ? '&' : '?'
    const targetUrl = `https://setsmart.io/api${suffix}${sep}clientId=sonuabraham0`
    console.log('[setsmart] ' + req.method + ' ' + targetUrl)
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: { 'x-api-key': '8444ca5e-654b-4a10-913f-4fc6485c2d7c', 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: ['GET','HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    })
    const text = await upstream.text()
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', 'application/json')
    res.status(upstream.status).send(text)
  } catch(e) {
    console.error('[setsmart] error:', e.message)
    res.status(502).json({ error: 'setsmart_proxy_error', detail: e.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Health
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status:       'ok',
    calls_stored: callsList.length,
    sse_clients:  sseClients.size,
    auth:         SHARED_SECRET ? 'secret_required' : 'open',
    api_key_set:  !!SARVAM_API_KEY,
    uptime_s:     process.uptime().toFixed(0),
  })
})

// Debug — confirms env vars are loaded (safe: only shows key prefix)
app.get('/api/debug', (req, res) => {
  res.json({
    api_key_prefix: SARVAM_API_KEY ? SARVAM_API_KEY.slice(0, 12) + '...' : 'NOT SET',
    port:           PORT,
    node_env:       process.env.NODE_ENV || 'not set',
    calls_stored:   callsList.length,
    org_id:         ORG_ID,
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Recording endpoint — exact curl format:
// GET /api/recording?id=20261104%2Fabc-uuid
// → GET https://apps.sarvam.ai/api/analytics/v1/{org}/{ws}/{app}/recordings/{id}
//   -H "X-API-Key: sk_aestf8eu_..."
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/recording', async (req, res) => {
  const rawId = req.query.id
  if (!rawId) return res.status(400).json({ error: 'missing id parameter' })

  const interactionId = String(rawId)
  // encodeURIComponent encodes / as %2F, : as %3A etc — exact same as curl
  const encodedId = encodeURIComponent(interactionId)
  const sarvamUrl = `https://apps.sarvam.ai/api/analytics/v1/${ORG_ID}/${WS_ID}/${APP_ID}/recordings/${encodedId}`
  const apiKey    = SARVAM_API_KEY

  console.log(`[recording] GET ${sarvamUrl}`)
  console.log(`[recording] key: ${apiKey ? apiKey.slice(0,15) + '...' : 'NOT SET'}`)

  try {
    const upstream = await fetch(sarvamUrl, {
      method:  'GET',
      headers: { 'X-API-Key': apiKey, 'Accept': 'audio/wav, audio/*, */*' },
    })

    console.log(`[recording] Sarvam responded: ${upstream.status}`)

    if (upstream.status === 404) return res.status(404).json({ error: 'NO_RECORDING' })
    if (upstream.status === 401) {
      const body = await upstream.text()
      console.error(`[recording] 401 body: ${body}`)
      return res.status(401).json({ error: 'INVALID_API_KEY', detail: body })
    }
    if (!upstream.ok) {
      const body = await upstream.text()
      return res.status(upstream.status).json({ error: `HTTP_${upstream.status}`, detail: body })
    }

    const ct  = upstream.headers.get('content-type') || 'audio/wav'
    const buf = Buffer.from(await upstream.arrayBuffer())
    res.setHeader('Content-Type',   ct)
    res.setHeader('Content-Length', buf.length)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).send(buf)

  } catch (err) {
    console.error('[recording] fetch error:', err.message)
    res.status(502).json({ error: 'fetch_failed', detail: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Transcript endpoint — query param to avoid %2F path decoding issues
// GET /api/transcript?id=20261104%2Fabc-uuid
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/transcript', async (req, res) => {
  const rawId = req.query.id
  if (!rawId) return res.status(400).json({ error: 'missing id parameter' })

  const encodedId = encodeURIComponent(String(rawId))
  const sarvamUrl = `https://apps.sarvam.ai/api/analytics/v1/${ORG_ID}/${WS_ID}/${APP_ID}/transcripts/${encodedId}`

  console.log(`[transcript] GET ${sarvamUrl}`)

  try {
    const upstream = await fetch(sarvamUrl, {
      headers: { 'X-API-Key': SARVAM_API_KEY, 'Accept': 'application/json' },
    })
    const text = await upstream.text()
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(upstream.status).send(text)
  } catch (err) {
    res.status(502).json({ error: 'fetch_failed', detail: err.message })
  }
})

// Forwarded recording (same pattern, different Sarvam endpoint)
app.get('/api/forwarded-recording', async (req, res) => {
  const rawId = req.query.id
  if (!rawId) return res.status(400).json({ error: 'missing id parameter' })
  const sarvamUrl = `https://apps.sarvam.ai/api/analytics/v1/${ORG_ID}/${WS_ID}/${APP_ID}/forwarded-recordings/${encodeURIComponent(String(rawId))}`
  try {
    const upstream = await fetch(sarvamUrl, { headers: { 'X-API-Key': SARVAM_API_KEY, 'Accept': 'audio/*,*/*' } })
    if (!upstream.ok) return res.status(upstream.status).json({ error: `HTTP_${upstream.status}` })
    const buf = Buffer.from(await upstream.arrayBuffer())
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'audio/wav')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).send(buf)
  } catch (err) { res.status(502).json({ error: 'fetch_failed', detail: err.message }) }
})
// ─────────────────────────────────────────────────────────────────────────────
app.get('/events', (req, res) => {
  res.set({
    'Content-Type':      'text/event-stream',
    'Cache-Control':     'no-cache',
    'Connection':        'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders()
  res.write('retry: 3000\n\n')
  res.write(`event: history\ndata: ${JSON.stringify(callsList.slice(0, 50))}\n\n`)
  sseClients.add(res)
  console.log(`[SSE] connected — clients: ${sseClients.size}`)
  req.on('close', () => {
    sseClients.delete(res)
    console.log(`[SSE] disconnected — clients: ${sseClients.size}`)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Webhook receiver  POST /webhook/call  (and legacy paths)
// ─────────────────────────────────────────────────────────────────────────────
async function handleWebhook(req, res, legacyMap) {
  const raw = legacyMap ? legacyMap(req.body) : req.body

  if (!isAuthorised(raw, req))
    return res.status(401).json({ error: 'unauthorised' })

  const missing = validate(raw)
  if (missing)
    return res.status(400).json({ error: 'missing_fields', detail: `Required: ${missing.join(', ')}` })

  // Respond immediately
  res.json({ received: true, interaction_id: raw.interaction_id })

  enqueue(async () => {
    const norm  = normalise(raw)
    const isNew = storeCall(norm)
    if (isNew) {
      console.log(`[webhook] NEW  ${norm.interaction_id} | ${norm.user_phone_number} | ${norm.duration ?? '?'}s`)
      broadcast('new_call', norm)
    } else {
      console.log(`[webhook] DUPE ${norm.interaction_id} — skipped`)
    }
  })
}

// Canonical endpoint — paste this URL into Sarvam
app.post('/api/webhook/call', (req, res) => handleWebhook(req, res, null))

// Legacy paths
app.post('/webhook/call', (req, res) => handleWebhook(req, res, null))

const legacyMapper = (body) => ({
  app_id:                 body.app_id            || 'unknown',
  app_version:            body.app_version        || 0,
  deployment_id:          body.deployment_id      || 'unknown',
  interaction_id:         body.interaction_id     || crypto.randomUUID(),
  user_phone_number:      body.user_phone_number  || body.channel_info?.agent_phone_number || 'unknown',
  agent_phone_number:     body.agent_phone_number || body.channel_info?.agent_phone_number || 'unknown',
  duration:               body.duration,
  recording_url:          body.recording_url      ?? null,
  start_datetime:         body.start_datetime     ?? null,
  end_datetime:           body.end_datetime       ?? null,
  final_agent_variables:  body.final_agent_variables  ?? null,
  output_agent_variables: body.output_agent_variables ?? null,
  interaction_transcript: body.interaction_transcript ?? null,
  metadata:               body.metadata           ?? null,
})

app.post('/api/webhook/inbound',  (req, res) => handleWebhook(req, res, legacyMapper))
app.post('/api/webhook/campaign', (req, res) => handleWebhook(req, res, legacyMapper))
app.post('/api/webhook/outbound', (req, res) => handleWebhook(req, res, legacyMapper))
app.post('/webhook/inbound',      (req, res) => handleWebhook(req, res, legacyMapper))
app.post('/webhook/campaign',     (req, res) => handleWebhook(req, res, legacyMapper))
app.post('/webhook/outbound',     (req, res) => handleWebhook(req, res, legacyMapper))

// ─────────────────────────────────────────────────────────────────────────────
// GET /webhook/calls  — paginated call list for the dashboard
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/webhook/calls', (req, res) => {
  const limit    = Math.min(parseInt(req.query.limit  || '100'), 1000)
  const offset   = Math.max(parseInt(req.query.offset || '0'),   0)
  const search   = (req.query.search      || '').toLowerCase()
  const dispFilt = (req.query.disposition || '').toLowerCase()

  let list = callsList
  if (search)   list = list.filter(c =>
    (c.user_phone_number || '').includes(search) ||
    (c.interaction_id    || '').includes(search) ||
    (c.caller_name       || '').toLowerCase().includes(search) ||
    (c.call_summary      || '').toLowerCase().includes(search)
  )
  if (dispFilt) list = list.filter(c =>
    (c.call_disposition || '').toLowerCase() === dispFilt
  )

  res.json({ total: list.length, limit, offset, items: list.slice(offset, offset + limit) })
})

// ─────────────────────────────────────────────────────────────────────────────
// Serve React app (must come LAST — after all API routes)
// ─────────────────────────────────────────────────────────────────────────────
const distDir = path.join(__dirname, 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  // SPA fallback — serve index.html for all unmatched routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
} else {
  app.get('*', (req, res) => {
    res.status(503).send(`
      <h2>Dashboard not built yet</h2>
      <p>Run <code>npm run build</code> first, then restart the server.</p>
    `)
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log('')
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║   Carmel College of Nursing — Voice Agent Dashboard      ║')
  console.log('╠══════════════════════════════════════════════════════════╣')
  console.log(`║   Listening on 0.0.0.0:${PORT}                               ║`)
  console.log(`║   http://localhost:${PORT}                                    ║`)
  console.log('╠══════════════════════════════════════════════════════════╣')
  console.log('║   Health:  /api/health                                   ║')
  console.log('║   Webhook: /api/webhook/call                             ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log('')
})
