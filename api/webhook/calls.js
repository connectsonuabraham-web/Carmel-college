'use strict'
/**
 * GET /api/webhook/calls
 * Returns stored calls — paginated. Dashboard polls this every 10s.
 */
const { loadCalls } = require('../_lib/store')

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'GET') return res.status(405).end()

  const limit    = Math.min(parseInt(req.query.limit  || '100'), 1000)
  const offset   = Math.max(parseInt(req.query.offset || '0'),   0)
  const search   = (req.query.search      || '').toLowerCase()
  const dispFilt = (req.query.disposition || '').toLowerCase()

  let list = await loadCalls()

  if (search)   list = list.filter(c =>
    (c.user_phone_number || '').includes(search) ||
    (c.interaction_id    || '').includes(search) ||
    (c.caller_name       || '').toLowerCase().includes(search) ||
    (c.call_summary      || '').toLowerCase().includes(search)
  )
  if (dispFilt) list = list.filter(c =>
    (c.call_disposition || '').toLowerCase() === dispFilt
  )

  res.status(200).json({
    total:  list.length,
    limit,
    offset,
    items:  list.slice(offset, offset + limit),
  })
}
