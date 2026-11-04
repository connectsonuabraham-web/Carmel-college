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
    const map: Record<string, string> = {
      connected: 'bg-green-100 text-green-700',
      disconnected: 'bg-red-100 text-red-700',
      failed: 'bg-red-100 text-red-700',
    }
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${map[s] ?? 'bg-gray-100 text-gray-600'}`}>
        {s}
      </span>
    )
  }

  const inputClass = 'rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400'

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

      {isLoading && <p className="text-sm text-gray-400 mb-2">Loading…</p>}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-card">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Date/Time', 'Caller', 'Duration', 'Language', 'Direction', 'Status', 'End Reason', 'Goal', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paged.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-400">No interactions found</td>
              </tr>
            ) : (
              paged.map((item) => (
                <tr key={item.interaction_id} className="hover:bg-green-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                    {item.started_at ? formatDateTime(item.started_at) : item.created_at ? formatDateTime(item.created_at) : '—'}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{item.user_contact_masked || '—'}</td>
                  <td className="px-4 py-3">{item.duration_in_seconds != null ? formatDuration(item.duration_in_seconds) : '—'}</td>
                  <td className="px-4 py-3">{item.language_name || '—'}</td>
                  <td className="px-4 py-3 capitalize">{item.channel_direction}</td>
                  <td className="px-4 py-3">{statusBadge(item.connectivity_status)}</td>
                  <td className="px-4 py-3 capitalize">{item.end_reason || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                      item.goal_overall_status === 'success' ? 'bg-green-100 text-green-700'
                      : item.goal_overall_status === 'failed' ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                    }`}>
                      {item.goal_overall_status || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => onOpen(item, 'transcript')} title="Transcript" className="p-1.5 rounded hover:bg-green-50 text-green-600">
                        <FileText size={15} />
                      </button>
                      <button onClick={() => onOpen(item, 'overview')} title="Recording" className="p-1.5 rounded hover:bg-green-50 text-green-600">
                        <Play size={15} />
                      </button>
                      <button onClick={() => onOpen(item, 'log-analyser')} title="Log Analyser" className="p-1.5 rounded hover:bg-green-50 text-green-700">
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
          <p className="text-sm text-gray-500">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded border disabled:opacity-40 hover:bg-green-50"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded border disabled:opacity-40 hover:bg-green-50"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
