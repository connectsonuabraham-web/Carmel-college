'use strict'
/**
 * POST /api/webhook/call
 * Sarvam posts here after every call. Stores the call in Vercel KV.
 * Responds 200 immediately — deduplicates on interaction_id.
 */
const { storeCall, normalise } = require('../_lib/store')
const crypto = require('crypto')

const SHARED_SECRET = process.env.WEBHOOK_SECRET || null
const REQUIRED = ['app_id','app_version','deployment_id','interaction_id','user_phone_number','agent_phone_number']

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Secret')
}

module.exports = async function handler(req, res) {
  cors(res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST')    return res.status(405).json({ error: 'method_not_allowed' })

  const raw = req.body

  // Auth
  if (SHARED_SECRET) {
    const ok = req.headers['x-webhook-secret'] === SHARED_SECRET ||
               raw?.metadata?.secret === SHARED_SECRET
    if (!ok) return res.status(401).json({ error: 'unauthorised' })
  }

  // Validate required fields
  const missing = REQUIRED.filter(k => raw[k] == null || raw[k] === '')
  if (missing.length)
    return res.status(400).json({ error: 'missing_fields', detail: `Required: ${missing.join(', ')}` })

  // Respond 200 immediately
  res.status(200).json({ received: true, interaction_id: raw.interaction_id })

  // Store (after response is sent — Vercel awaits the handler so this still runs)
  try {
    const norm  = normalise(raw)
    const isNew = await storeCall(norm)
    console.log(`[webhook] ${isNew ? 'NEW ' : 'DUPE'} ${norm.interaction_id}`)
  } catch (e) {
    console.error('[webhook] store error:', e.message)
  }
}
