import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { useInteractions } from '../hooks/useInteractions'
import { CallsTable } from '../components/CallsTable'
import { TranscriptPanel } from '../components/TranscriptPanel'
import { DateRangePicker } from '../components/DateRangePicker'
import { DateRange, Interaction } from '../types'
import { defaultDateRange } from '../utils/dateUtils'

type PanelTab = 'overview' | 'transcript' | 'log-analyser'

interface AdvancedFilter {
  language_name: string
  channel_direction: string
  channel_type: string
  connectivity_status: string
  end_reason: string
  ended_by: string
  goal_overall_status: string
  duration_min: string
  duration_max: string
  num_messages_min: string
  num_messages_max: string
  is_debug_call: string
  has_log_issues: string
  [key: string]: string
}

const defaultFilters: AdvancedFilter = {
  language_name: '', channel_direction: '', channel_type: '', connectivity_status: '',
  end_reason: '', ended_by: '', goal_overall_status: '', duration_min: '', duration_max: '',
  num_messages_min: '', num_messages_max: '', is_debug_call: '', has_log_issues: '',
}

function applyAdvancedFilters(interactions: Interaction[], filters: AdvancedFilter): Interaction[] {
  return interactions.filter((i) => {
    if (filters.language_name && i.language_name !== filters.language_name) return false
    if (filters.channel_direction && i.channel_direction !== filters.channel_direction) return false
    if (filters.channel_type && i.channel_type !== filters.channel_type) return false
    if (filters.connectivity_status && i.connectivity_status !== filters.connectivity_status) return false
    if (filters.end_reason && i.end_reason !== filters.end_reason) return false
    if (filters.ended_by && i.ended_by !== filters.ended_by) return false
    if (filters.goal_overall_status && i.goal_overall_status !== filters.goal_overall_status) return false
    if (filters.duration_min && (i.duration_in_seconds ?? 0) < Number(filters.duration_min)) return false
    if (filters.duration_max && (i.duration_in_seconds ?? 0) > Number(filters.duration_max)) return false
    if (filters.num_messages_min && (i.num_messages ?? 0) < Number(filters.num_messages_min)) return false
    if (filters.num_messages_max && (i.num_messages ?? 0) > Number(filters.num_messages_max)) return false
    if (filters.is_debug_call !== '') {
      const val = filters.is_debug_call === 'true'
      if ((i as unknown as Record<string, unknown>).is_debug_call !== val) return false
    }
    if (filters.has_log_issues !== '') {
      const val = filters.has_log_issues === 'true'
      if ((i as unknown as Record<string, unknown>).has_log_issues !== val) return false
    }
    return true
  })
}

function getUniqueValues(interactions: Interaction[], field: keyof Interaction): string[] {
  const set = new Set<string>()
  interactions.forEach((i) => { const v = i[field]; if (v) set.add(String(v)) })
  return Array.from(set).sort()
}

export function CallsPage() {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange)
  const [selected, setSelected] = useState<Interaction | null>(null)
  const [initialTab, setInitialTab] = useState<PanelTab>('transcript')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [advFilters, setAdvFilters] = useState<AdvancedFilter>(defaultFilters)

  const { data, isFetching } = useInteractions(dateRange)
  const allInteractions = data?.items ?? []
  const interactions = applyAdvancedFilters(allInteractions, advFilters)

  function openPanel(interaction: Interaction, tab: PanelTab) {
    setSelected(interaction)
    setInitialTab(tab)
  }

  function updateFilter(key: keyof AdvancedFilter, value: string) {
    setAdvFilters((prev) => ({ ...prev, [key]: value }))
  }

  function clearFilters() { setAdvFilters(defaultFilters) }

  const activeFilterCount = Object.values(advFilters).filter((v) => v !== '').length

  const selectClass = 'rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 min-w-[120px]'
  const inputClass  = 'rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 w-24'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-4 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Call Logs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data?.total ?? 0} total interactions · click a row to view transcript, recording &amp; log analyser</p>
        </div>
        {isFetching && <span className="text-xs text-green-600 animate-pulse font-medium">Refreshing…</span>}
      </div>

      <DateRangePicker value={dateRange} onChange={setDateRange} />

      {/* Advanced Filters */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <button
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span className="flex items-center gap-2">
            <Filter size={15} />
            Advanced Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5">{activeFilterCount}</span>
            )}
          </span>
          {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {showAdvanced && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-3">
            <div className="flex flex-wrap gap-3">
              {[
                { label: 'Language',    key: 'language_name',      opts: getUniqueValues(allInteractions, 'language_name') },
                { label: 'Connectivity',key: 'connectivity_status', opts: getUniqueValues(allInteractions, 'connectivity_status') },
                { label: 'End Reason',  key: 'end_reason',         opts: getUniqueValues(allInteractions, 'end_reason') },
                { label: 'Ended By',    key: 'ended_by',           opts: getUniqueValues(allInteractions, 'ended_by') },
                { label: 'Goal Status', key: 'goal_overall_status', opts: getUniqueValues(allInteractions, 'goal_overall_status') },
                { label: 'Channel Type',key: 'channel_type',       opts: getUniqueValues(allInteractions, 'channel_type') },
              ].map(({ label, key, opts }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">{label}</label>
                  <select value={(advFilters as Record<string, string>)[key]} onChange={(e) => updateFilter(key as keyof AdvancedFilter, e.target.value)} className={selectClass}>
                    <option value="">All</option>
                    {opts.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              ))}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Direction</label>
                <select value={advFilters.channel_direction} onChange={(e) => updateFilter('channel_direction', e.target.value)} className={selectClass}>
                  <option value="">All</option>
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                </select>
              </div>
              {[
                { label: 'Min Duration (s)', key: 'duration_min', ph: '30' },
                { label: 'Max Duration (s)', key: 'duration_max', ph: '300' },
                { label: 'Min Turns',        key: 'num_messages_min', ph: '2' },
                { label: 'Max Turns',        key: 'num_messages_max', ph: '20' },
              ].map(({ label, key, ph }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">{label}</label>
                  <input type="number" placeholder={ph} value={(advFilters as Record<string, string>)[key]} onChange={(e) => updateFilter(key as keyof AdvancedFilter, e.target.value)} className={inputClass} />
                </div>
              ))}
              {[
                { label: 'Debug Call',    key: 'is_debug_call' },
                { label: 'Has Log Issues',key: 'has_log_issues' },
              ].map(({ label, key }) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">{label}</label>
                  <select value={(advFilters as Record<string, string>)[key]} onChange={(e) => updateFilter(key as keyof AdvancedFilter, e.target.value)} className={selectClass}>
                    <option value="">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              ))}
            </div>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="mt-3 text-xs text-red-500 hover:text-red-700 underline">
                Clear all filters ({activeFilterCount})
              </button>
            )}
          </div>
        )}
      </div>

      <CallsTable
        interactions={interactions}
        isLoading={isFetching}
        onOpen={openPanel}
      />
      <TranscriptPanel interaction={selected} onClose={() => setSelected(null)} initialTab={initialTab} />
    </div>
  )
}
