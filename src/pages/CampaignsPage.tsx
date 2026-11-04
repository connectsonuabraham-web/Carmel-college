import React, { useState, useMemo } from 'react'
import { Megaphone, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { useCampaigns } from '../hooks/useCampaigns'
import { Campaign } from '../types'
import { formatDateTime } from '../utils/dateUtils'

const STATUS_COLORS: Record<Campaign['status'], string> = {
  active: 'bg-green-100 text-green-700',
  scheduled: 'bg-blue-100 text-blue-700',
  ended: 'bg-gray-100 text-gray-600',
  paused: 'bg-yellow-100 text-yellow-700',
  cancelled: 'bg-red-100 text-red-700',
}

export function CampaignsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data, isFetching, error } = useCampaigns(
    statusFilter ? { campaign_status: statusFilter as Campaign['status'] } : {}
  )

  const campaigns = data?.items ?? []

  const filtered = useMemo(() => {
    if (!search) return campaigns
    const q = search.toLowerCase()
    return campaigns.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.campaign_id.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q)
    )
  }, [campaigns, search])

  const statuses: Campaign['status'][] = ['active', 'scheduled', 'ended', 'paused', 'cancelled']
  const countByStatus = (s: Campaign['status']) => campaigns.filter((c) => c.status === s).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-sm text-gray-500 mt-0.5">Scheduled outreach campaigns for Carmel College of Nursing</p>
        </div>
        {isFetching && <span className="text-xs text-green-600 animate-pulse font-medium">Refreshing…</span>}
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
            className={`rounded-2xl border p-3 text-left transition-all ${
              statusFilter === s
                ? 'border-green-400 ring-1 ring-green-400 bg-green-50'
                : 'border-gray-100 bg-white shadow-card hover:border-gray-200'
            }`}
          >
            <p className="text-lg font-bold text-gray-900">{countByStatus(s)}</p>
            <p className="text-xs text-gray-500 capitalize mt-0.5">{s}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          placeholder="Search campaigns…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          Failed to load campaigns. The campaigns API may require additional permissions.
        </div>
      )}

      {/* Campaign cards */}
      <div className="space-y-3">
        {filtered.length === 0 && !isFetching && (
          <p className="text-sm text-gray-400 text-center py-12">
            {error ? '' : 'No campaigns found'}
          </p>
        )}
        {filtered.map((campaign) => (
          <div
            key={campaign.campaign_id}
            className="rounded-2xl border border-gray-100 bg-white shadow-card overflow-hidden"
          >
            {/* Card header */}
            <button
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-green-50 transition-colors text-left"
              onClick={() =>
                setExpanded(expanded === campaign.campaign_id ? null : campaign.campaign_id)
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Megaphone size={16} className="text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{campaign.name}</p>
                  <p className="text-xs text-gray-400 font-mono truncate">{campaign.campaign_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[campaign.status]}`}
                >
                  {campaign.status}
                </span>
                {expanded === campaign.campaign_id ? (
                  <ChevronUp size={16} className="text-gray-400" />
                ) : (
                  <ChevronDown size={16} className="text-gray-400" />
                )}
              </div>
            </button>

            {/* Expanded details */}
            {expanded === campaign.campaign_id && (
              <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {campaign.description && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-400 mb-1">Description</p>
                      <p className="text-gray-700">{campaign.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-400 mb-1">App ID</p>
                    <p className="font-mono text-xs text-gray-700">{campaign.app_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Created By</p>
                    <p className="text-gray-700">{campaign.created_by}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Start Time</p>
                    <p className="text-gray-700">
                      {campaign.start_timestamp ? formatDateTime(campaign.start_timestamp) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">End Time</p>
                    <p className="text-gray-700">
                      {campaign.end_timestamp ? formatDateTime(campaign.end_timestamp) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Created At</p>
                    <p className="text-gray-700">{formatDateTime(campaign.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Last Updated</p>
                    <p className="text-gray-700">{formatDateTime(campaign.updated_at)}</p>
                  </div>
                  {campaign.app_version != null && (
                    <div>
                      <p className="text-xs text-gray-400 mb-1">App Version</p>
                      <p className="text-gray-700">{campaign.app_version}</p>
                    </div>
                  )}
                </div>
                {(campaign.status === 'active' || campaign.status === 'ended') && (
                  <div className="mt-4">
                    <a
                      href={`/calls?campaign_id=${campaign.campaign_id}`}
                      className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:underline"
                    >
                      <ExternalLink size={12} />
                      View calls for this campaign
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
