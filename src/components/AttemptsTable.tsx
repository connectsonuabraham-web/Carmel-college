import React, { useState } from 'react'
import { Attempt } from '../types'
import { formatDateTime } from '../utils/dateUtils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  attempts: Attempt[]
  isLoading?: boolean
}

const PAGE_SIZE = 20

export function AttemptsTable({ attempts, isLoading }: Props) {
  const [page, setPage] = useState(0)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterReason, setFilterReason] = useState('')

  const reasons = [...new Set(attempts.map((a) => a.failure_reason).filter(Boolean))] as string[]

  const filtered = attempts.filter((a) => {
    const matchStatus = !filterStatus || a.connectivity_status === filterStatus
    const matchReason = !filterReason || a.failure_reason === filterReason
    return matchStatus && matchReason
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const selectClass = 'rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400'

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(0) }}
          className={selectClass}
        >
          <option value="">All Statuses</option>
          <option value="connected">Connected</option>
          <option value="failed">Failed</option>
          <option value="no_answer">No Answer</option>
        </select>
        {reasons.length > 0 && (
          <select
            value={filterReason}
            onChange={(e) => { setFilterReason(e.target.value); setPage(0) }}
            className={selectClass}
          >
            <option value="">All Failure Reasons</option>
            {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        )}
      </div>

      {isLoading && <p className="text-sm text-gray-400 mb-2">Loading…</p>}

      <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-card">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Attempt ID', 'Interaction ID', 'Date/Time', 'Caller', 'Direction', 'Status', 'Failure Reason'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paged.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No attempts found</td></tr>
            ) : (
              paged.map((item) => (
                <tr key={item.attempt_id} className="hover:bg-green-50">
                  <td className="px-4 py-3 font-mono text-xs">{item.attempt_id}</td>
                  <td className="px-4 py-3 font-mono text-xs">{item.interaction_id ?? '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{item.started_at ? formatDateTime(item.started_at) : item.created_at ? formatDateTime(item.created_at) : '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs">{item.user_contact_masked}</td>
                  <td className="px-4 py-3 capitalize">{item.channel_direction}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      item.connectivity_status === 'connected' ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                    }`}>
                      {item.connectivity_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize">{item.failure_reason ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded border disabled:opacity-40 hover:bg-green-50">
              <ChevronLeft size={16} />
            </button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded border disabled:opacity-40 hover:bg-green-50">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
