'use strict'
/**
 * /api/sarvam/* → proxies to https://apps.sarvam.ai/api/analytics/v1/*
 * Injects X-API-Key server-side. Preserves %2F in recording IDs.
 */
module.exports = async function handler(req, res) {
  const apiKey = process.env.SARVAM_API_KEY || process.env.VITE_SARVAM_API_KEY || ''
  const ORG_ID = process.env.SARVAM_ORG_ID       || '01a02774-5a8e-7417-83b2-bcd5ec5b0a93'
  const WS_ID  = process.env.SARVAM_WORKSPACE_ID || '01a02774-5a93-78e1-88df-42475fe29aa0'
  const APP_ID = process.env.SARVAM_APP_ID        || 'Conversatio-63a490c9-20af'

  // req.query.path is an array of path segments from the catch-all
  const segments = Array.isArray(req.query.path) ? req.query.path : [req.query.path]
  const rest     = segments.join('/')

  // Rebuild query string (exclude 'path' which is the catch-all param)
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(req.query)) {
    if (k === 'path') continue
    if (Array.isArray(v)) v.forEach(val => qs.append(k, val))
    else qs.set(k, v)
  }
  const qsPart = qs.toString() ? `?${qs.toString()}` : ''

  // Target: /api/analytics/v1/{org}/{ws}/{app}/{rest}
  const target = `https://apps.sarvam.ai/api/analytics/v1/${ORG_ID}/${WS_ID}/${APP_ID}/${rest}${qsPart}`

  const headers = {
    'X-API-Key':    apiKey,
    'Content-Type': req.headers['content-type'] || 'application/json',
  }

  // For binary responses (recordings) we need arraybuffer
  const isRecording = rest.startsWith('recordings/') || rest.startsWith('forwarded-recordings/')

  try {
    const upstream = await fetch(target, {
      method:  req.method,
      headers,
      body:    ['GET','HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
    })

    res.setHeader('Access-Control-Allow-Origin', '*')

    // Forward status and content-type
    const ct = upstream.headers.get('content-type') || 'application/json'
    res.setHeader('Content-Type', ct)

    if (isRecording && upstream.ok) {
      const buffer = Buffer.from(await upstream.arrayBuffer())
      res.status(upstream.status).send(buffer)
    } else {
      const text = await upstream.text()
      res.status(upstream.status).send(text)
    }
  } catch (e) {
    res.status(502).json({ error: 'proxy_error', detail: e.message })
  }
}
