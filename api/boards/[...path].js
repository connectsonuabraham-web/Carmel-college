'use strict'
/**
 * /api/boards/* → https://apps.sarvam.ai/api/analytics/v1/{org}/{ws}/boards/*
 */
module.exports = async function handler(req, res) {
  const apiKey = process.env.SARVAM_API_KEY || process.env.VITE_SARVAM_API_KEY || ''
  const ORG_ID = process.env.SARVAM_ORG_ID       || '01a02774-5a8e-7417-83b2-bcd5ec5b0a93'
  const WS_ID  = process.env.SARVAM_WORKSPACE_ID || '01a02774-5a93-78e1-88df-42475fe29aa0'

  const segments = Array.isArray(req.query.path) ? req.query.path : [req.query.path]
  const rest     = segments.join('/')

  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(req.query)) {
    if (k === 'path') continue
    if (Array.isArray(v)) v.forEach(val => qs.append(k, val))
    else qs.set(k, v)
  }
  const qsPart = qs.toString() ? `?${qs.toString()}` : ''

  const target = `https://apps.sarvam.ai/api/analytics/v1/${ORG_ID}/${WS_ID}/boards/${rest}${qsPart}`

  try {
    const upstream = await fetch(target, {
      method:  req.method,
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
      body:    ['GET','HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    })
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json')
    res.status(upstream.status).send(await upstream.text())
  } catch (e) {
    res.status(502).json({ error: 'proxy_error', detail: e.message })
  }
}
