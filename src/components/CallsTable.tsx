import React, { useState } from 'react'
import { Interaction } from '../types'
import { formatDateTime, formatDuration } from '../utils/dateUtils'
import { FileText, Play, Activity, ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  interactions: Interaction[]
  onOpen: (i: Interaction, tab: 'overview' | 'transcript' | 'log-analyser') => void
  isLoading?: boolean
}

const PAGE_SIZE = 20

export function CallsTable({ interactions, onOpen, isLoading }: Props) {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [filterDir, setFilterDir] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterGoal, setFilterGoal] = useState('')

  const filtered = interactions.filter((i) => {
    const matchSearch =
      !search ||
      i.user_contact_masked?.includes(search) ||
      i.interaction_id?.includes(search) ||
      i.language_name?.toLowerCase().includes(search.toLowerCase())
    const matchDir = !filterDir || i.channel_direction === filterDir
    const matchStatus = !filterStatus || i.connectivity_status === filterStatus
    const matchGoal = !filterGoal || i.goal_overall_status === filterGoal
    return matchSearch && matchDir && matchStatus && matchGoal
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const statusBadge = (s: string) => {
    let cls: string
    if (s === 'connected') {
      cls = 'bg-\[#d8f58f\]/60 text-\[#1f6b47\]'
    } else if (s === 'failed' || s === 'disconnected') {
      cls = 'bg-red-50 text-\[#d9534f\]'
    } else {
      cls = 'bg-orange-50 text-\[#f0883e\]'
    }
    return (
      <span className={`rounded-md px-2 py-0.5 text-xs capitalize ${cls}`}>
        {s}
      </span>
    )
  }

  const inputClass = 'rounded-lg border border-\[#e8ebe8\] bg-white px-3 py-1.5 text-sm text-\[#7b857f\] focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/40'

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          placeholder="Search ID, contact, language…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          className={`flex-1 min-w-[180px] ${inputClass}`}
        />
        <select
          value={filterDir}
          onChange={(e) => { setFilterDir(e.target.value); setPage(0) }}
          className={inputClass}
        >
          <option value="">All Directions</option>
          <option value="inbound">Inbound</option>
          <option value="outbound">Outbound</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(0) }}
          className={inputClass}
        >
          <option value="">All Statuses</option>
          <option value="connected">Connected</option>
          <option value="disconnected">Disconnected</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={filterGoal}
          onChange={(e) => { setFilterGoal(e.target.value); setPage(0) }}
          className={inputClass}
        >
          <option value="">All Goals</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="incomplete">Incomplete</option>
        </select>
      </div>

      {isLoading && <p className="text-sm text-\[#7b857f\] mb-2">Loading…</p>}

      {/* Table */}
      <div className="bg-white rounded-\[16px\] border border-\[#e8ebe8\] overflow-hidden overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-\[#f5f6f4\]">
            <tr>
              {['Date/Time', 'Caller', 'Duration', 'Language', 'Direction', 'Status', 'End Reason', 'Goal', 'Actions'].map((h) => (
                <th key={h} className="text-[10px] uppercase tracking-widest text-\[#7b857f\] font-semibold px-4 py-3 text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-\[#7b857f\] text-sm">No interactions found</td>
              </tr>
            ) : (
              paged.map((item) => (
                <tr
                  key={item.interaction_id}
                  className="border-b border-white/[0.04] hover:bg-\[#f5f6f4\] transition-colors cursor-pointer"
                >
                  <td className="text-[13px] text-\[#7b857f\] px-4 py-3 whitespace-nowrap">
                    {item.started_at ? formatDateTime(item.started_at) : item.created_at ? formatDateTime(item.created_at) : '—'}
                  </td>
                  <td className="text-[13px] text-\[#7b857f\] px-4 py-3 font-mono text-xs">{item.user_contact_masked || '—'}</td>
                  <td className="text-[13px] text-\[#7b857f\] px-4 py-3">{item.duration_in_seconds != null ? formatDuration(item.duration_in_seconds) : '—'}</td>
                  <td className="text-[13px] text-\[#7b857f\] px-4 py-3">{item.language_name || '—'}</td>
                  <td className="text-[13px] text-\[#7b857f\] px-4 py-3 capitalize">{item.channel_direction}</td>
                  <td className="text-[13px] text-\[#7b857f\] px-4 py-3">{statusBadge(item.connectivity_status)}</td>
                  <td className="text-[13px] text-\[#7b857f\] px-4 py-3 capitalize">{item.end_reason || '—'}</td>
                  <td className="text-[13px] text-\[#7b857f\] px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs capitalize ${
                      item.goal_overall_status === 'success'
                        ? 'bg-\[#d8f58f\]/60 text-\[#1f6b47\]'
                        : item.goal_overall_status === 'failed'
                        ? 'bg-red-50 text-\[#d9534f\]'
                        : 'bg-orange-50 text-\[#f0883e\]'
                    }`}>
                      {item.goal_overall_status || '—'}
                    </span>
                  </td>
                  <td className="text-[13px] text-\[#7b857f\] px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => onOpen(item, 'transcript')} title="Transcript" className="p-1.5 rounded hover:bg-\[#f5f6f4\] text-\[#1f6b47\]">
                        <FileText size={15} />
                      </button>
                      <button onClick={() => onOpen(item, 'overview')} title="Recording" className="p-1.5 rounded hover:bg-\[#f5f6f4\] text-\[#1f6b47\]">
                        <Play size={15} />
                      </button>
                      <button onClick={() => onOpen(item, 'log-analyser')} title="Log Analyser" className="p-1.5 rounded hover:bg-\[#f5f6f4\] text-\[#1f6b47\]">
                        <Activity size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-\[#7b857f\] text-sm">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="bg-white border border-\[#e8ebe8\] text-\[#7b857f\] rounded-lg px-2 py-1 hover:bg-\[#f5f6f4\] disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="bg-white border border-\[#e8ebe8\] text-\[#7b857f\] rounded-lg px-2 py-1 hover:bg-\[#f5f6f4\] disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
