import React, { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useInteractions } from '../hooks/useInteractions'
import { DateRangePicker } from '../components/DateRangePicker'
import { DateRange, Interaction } from '../types'
import { defaultDateRange, formatDuration } from '../utils/dateUtils'

type Dimension = 'language_name' | 'channel_direction' | 'channel_type' | 'end_reason' | 'goal_overall_status' | 'ended_by'

const DIMENSIONS: { value: Dimension; label: string }[] = [
  { value: 'language_name', label: 'Language' },
  { value: 'channel_direction', label: 'Channel Direction' },
  { value: 'channel_type', label: 'Channel Type' },
  { value: 'end_reason', label: 'End Reason' },
  { value: 'goal_overall_status', label: 'Goal Status' },
  { value: 'ended_by', label: 'Ended By' },
]

interface GroupRow {
  dimension: string
  interactionCount: number
  connectedCount: number
  connectivityRate: number
  avgDuration: number
  avgTurns: number
  goalSuccessRate: number
}

type SortKey = keyof GroupRow

function buildGroupRows(interactions: Interaction[], dimension: Dimension): GroupRow[] {
  const map = new Map<string, Interaction[]>()
  interactions.forEach((i) => {
    const key = (i[dimension] as string) || '(unknown)'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(i)
  })
  return Array.from(map.entries()).map(([dim, items]) => {
    const connected = items.filter((i) => i.connectivity_status === 'connected').length
    const avgDur =
      items.length > 0
        ? Math.round(items.reduce((s, i) => s + (i.duration_in_seconds ?? 0), 0) / items.length)
        : 0
    const avgTurns =
      items.length > 0
        ? Math.round(items.reduce((s, i) => s + (i.num_messages ?? 0), 0) / items.length)
        : 0
    const successGoals = items.filter(
      (i) => i.goal_overall_status === 'success' || i.goal_overall_status === 'completed'
    ).length
    return {
      dimension: dim,
      interactionCount: items.length,
      connectedCount: connected,
      connectivityRate: items.length > 0 ? Math.round((connected / items.length) * 100) : 0,
      avgDuration: avgDur,
      avgTurns,
      goalSuccessRate:
        items.length > 0 ? Math.round((successGoals / items.length) * 100) : 0,
    }
  })
}

function SortIcon({ col, sortKey, sortAsc }: { col: SortKey; sortKey: SortKey; sortAsc: boolean }) {
  if (sortKey !== col) return <ChevronDown size={12} className="opacity-30" />
  return sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
}

function ColHeader({
  label,
  col,
  sortKey,
  sortAsc,
  onToggle,
}: {
  label: string
  col: SortKey
  sortKey: SortKey
  sortAsc: boolean
  onToggle: (key: SortKey) => void
}) {
  return (
    <th
      onClick={() => onToggle(col)}
      className="px-4 py-3 text-left text-xs font-semibold text-[#475569] uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-[#94a3b8] select-none"
    >
      <span className="flex items-center gap-1">
        {label} <SortIcon col={col} sortKey={sortKey} sortAsc={sortAsc} />
      </span>
    </th>
  )
}

export function GroupByPage() {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange)
  const [dimension, setDimension] = useState<Dimension>('language_name')
  const [sortKey, setSortKey] = useState<SortKey>('interactionCount')
  const [sortAsc, setSortAsc] = useState(false)

  const { data: intData, isFetching } = useInteractions(dateRange)
  const interactions = intData?.items ?? []

  const rows = useMemo(() => {
    const base = buildGroupRows(interactions, dimension)
    return [...base].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
  }, [interactions, dimension, sortKey, sortAsc])

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else {
      setSortKey(key)
      setSortAsc(false)
    }
  }

  const dimLabel = DIMENSIONS.find((d) => d.value === dimension)?.label ?? dimension

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#f1f5f9]">Group By Analysis</h1>
          <p className="text-sm text-[#475569] mt-0.5">Aggregate metrics grouped by a call dimension</p>
        </div>
        {isFetching && <span className="text-xs text-green-600 animate-pulse font-medium">Refreshing…</span>}
      </div>

      <DateRangePicker value={dateRange} onChange={setDateRange} />

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-[#94a3b8]">Group by:</label>
        <select
          value={dimension}
          onChange={(e) => setDimension(e.target.value as Dimension)}
          className="rounded-lg border border-white/[0.08] bg-[#1a1d2e] px-3 py-1.5 text-sm text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400"
        >
          {DIMENSIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-[#1a1d2e] rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white/[0.04]">
              <tr>
                <ColHeader label={dimLabel} col="dimension" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggleSort} />
                <ColHeader label="Interactions" col="interactionCount" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggleSort} />
                <ColHeader label="Connected" col="connectedCount" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggleSort} />
                <ColHeader label="Connect Rate" col="connectivityRate" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggleSort} />
                <ColHeader label="Avg Duration" col="avgDuration" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggleSort} />
                <ColHeader label="Avg Turns" col="avgTurns" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggleSort} />
                <ColHeader label="Goal Success" col="goalSuccessRate" sortKey={sortKey} sortAsc={sortAsc} onToggle={toggleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] bg-[#1a1d2e]">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#475569] text-sm">
                    No data
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.dimension}
                    className="hover:bg-green-500/[0.06] transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-[#f1f5f9] capitalize">
                      {row.dimension}
                    </td>
                    <td className="px-4 py-3 text-[#94a3b8]">{row.interactionCount}</td>
                    <td className="px-4 py-3 text-[#94a3b8]">{row.connectedCount}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          row.connectivityRate >= 70
                            ? 'bg-green-500/10 text-green-400'
                            : row.connectivityRate >= 40
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {row.connectivityRate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#94a3b8]">
                      {formatDuration(row.avgDuration)}
                    </td>
                    <td className="px-4 py-3 text-[#94a3b8]">{row.avgTurns}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          row.goalSuccessRate >= 70
                            ? 'bg-green-500/10 text-green-400'
                            : row.goalSuccessRate >= 40
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {row.goalSuccessRate}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
