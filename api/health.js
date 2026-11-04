'use strict'
const { loadCalls, hasKV } = require('./_lib/store')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  const calls = await loadCalls()
  res.status(200).json({
    status:       'ok',
    storage:      hasKV() ? 'vercel-kv' : 'memory (local dev)',
    calls_stored: calls.length,
    uptime_s:     process.uptime().toFixed(0),
  })
}
