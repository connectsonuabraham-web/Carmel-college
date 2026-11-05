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

  const selectClass = 'rounded-lg border border-white/[0.06] bg-[#1a1d2e] px-3 py-1.5 text-sm text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/40'

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

      {isLoading && <p className="text-sm text-[#475569] mb-2">Loading…</p>}

      <div className="bg-[#1a1d2e] rounded-xl border border-white/[0.06] overflow-hidden overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/[0.03]">
            <tr>
              {['Attempt ID', 'Interaction ID', 'Date/Time', 'Caller', 'Direction', 'Status', 'Failure Reason'].map((h) => (
                <th key={h} className="text-[10px] uppercase tracking-widest text-[#475569] font-semibold px-4 py-3 text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-[#475569] text-sm">No attempts found</td></tr>
            ) : (
              paged.map((item) => (
                <tr key={item.attempt_id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="text-[13px] text-[#94a3b8] px-4 py-3 font-mono text-xs">{item.attempt_id}</td>
                  <td className="text-[13px] text-[#94a3b8] px-4 py-3 font-mono text-xs">{item.interaction_id ?? '—'}</td>
                  <td className="text-[13px] text-[#94a3b8] px-4 py-3 whitespace-nowrap">{item.started_at ? formatDateTime(item.started_at) : item.created_at ? formatDateTime(item.created_at) : '—'}</td>
                  <td className="text-[13px] text-[#94a3b8] px-4 py-3 font-mono text-xs">{item.user_contact_masked}</td>
                  <td className="text-[13px] text-[#94a3b8] px-4 py-3 capitalize">{item.channel_direction}</td>
                  <td className="text-[13px] text-[#94a3b8] px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs capitalize ${
                      item.connectivity_status === 'connected'
                        ? 'bg-green-500/10 text-green-400'
                        : item.connectivity_status === 'failed'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {item.connectivity_status}
                    </span>
                  </td>
                  <td className="text-[13px] text-[#94a3b8] px-4 py-3 capitalize">{item.failure_reason ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-[#94a3b8] text-sm">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}</p>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="bg-[#1a1d2e] border border-white/[0.06] text-[#94a3b8] rounded-lg px-2 py-1 hover:bg-white/[0.04] disabled:opacity-40">
              <ChevronLeft size={16} />
            </button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="bg-[#1a1d2e] border border-white/[0.06] text-[#94a3b8] rounded-lg px-2 py-1 hover:bg-white/[0.04] disabled:opacity-40">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
