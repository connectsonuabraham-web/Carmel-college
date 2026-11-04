import React, { useMemo, useState } from 'react'
import { useWebhookCalls } from '../hooks/useWebhookCalls'
import { useInteractions } from '../hooks/useInteractions'
import { useAttempts } from '../hooks/useAttempts'
import { StatCard } from '../components/StatCard'
import { DateRangePicker } from '../components/DateRangePicker'
import { CallsPerDayChart } from '../components/charts/CallsPerDayChart'
import { EndReasonChart } from '../components/charts/EndReasonChart'
import { GoalStatusChart } from '../components/charts/GoalStatusChart'
import { DateRange, Interaction, WebhookCall } from '../types'
import { defaultDateRange, formatDuration, formatDateShort } from '../utils/dateUtils'
import { format, eachDayOfInterval } from 'date-fns'
import {
  RadialBarChart, RadialBar, BarChart, Bar, Cell, ResponsiveContainer,
  PieChart, Pie, Tooltip, Legend
} from 'recharts'
import { useLeads, useConversations, useAiOffLeads } from '../hooks/useSetSmart'
import type { Lead } from '../api/setsmart'
import { MessageCircle, BarChart3 } from 'lucide-react'

const OUTCOME_COLORS = ['#4CAF50', '#ef4444', '#f59e0b', '#6366f1', '#94a3b8']

// Convert webhook call to Interaction shape for unified display
function webhookToInteraction(wc: WebhookCall): Interaction {
  return {
    interaction_id:     wc.interaction_id ?? '',
    language_name:      '',
    channel_type:       'voice',
    channel_direction:  'inbound',
    connectivity_status: 'connected',
    duration_in_seconds: wc.duration ?? 0,
    end_reason:         wc.call_disposition ?? '',
    ended_by:           '',
    num_messages:       0,
    goal_overall_status: wc.call_disposition === 'enrolled' || wc.call_disposition === 'interested' ? 'success' : wc.call_disposition ?? '',
    user_contact:       wc.user_phone_number ?? '',
    user_contact_masked: wc.user_phone_number ?? '',
    agent_variables:    wc.final_agent_variables ?? {},
    started_at:         wc.start_datetime ?? wc.received_at,
    created_at:         wc.received_at,
  }
}

function WhatsAppQuickSection() {
  const { data: leads = [] } = useLeads()
  const { data: convsResp } = useConversations()
  const { data: aiOff = [] } = useAiOffLeads()

  const totalConversations = convsResp?.total ?? 0
  const totalMessages = convsResp?.conversations.reduce((s, c) => s + c.message_count, 0) ?? 0
  const bookedLeads = leads.filter((l: Lead) => l.ok_call !== 'N/A').length
  const aiActive = leads.length - aiOff.length
  const recentConvs = [...(convsResp?.conversations ?? [])]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3)

  if (leads.length === 0 && totalConversations === 0) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle size={15} className="text-green-500" /> Recent WhatsApp Conversations
          </h3>
          <a href="/whatsapp/conversations" className="text-xs text-green-600 hover:underline">View All →</a>
        </div>
        {recentConvs.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No WhatsApp conversations yet</p>
        ) : (
          <div className="space-y-3">
            {recentConvs.map((conv, i) => {
              const name = conv.contact.name || 'Unknown'
              const status = conv.qualification.status || 'New'
              const statusMap: Record<string, string> = { Qualified: 'bg-green-100 text-green-700', Booked: 'bg-blue-100 text-blue-700', Open: 'bg-gray-100 text-gray-600', New: 'bg-yellow-100 text-yellow-700' }
              return (
                <div key={i} className="flex items-center gap-3 py-1">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-700 text-[10px] font-bold">{name.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{name}</p>
                    <p className="text-[10px] text-gray-400 truncate">{conv.messages[conv.messages.length - 1]?.content ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusMap[status] ?? 'bg-gray-100 text-gray-600'}`}>{status}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 size={15} className="text-green-500" /> WhatsApp Summary
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-2xl font-bold text-gray-900">{totalConversations}</p><p className="text-xs text-gray-400">Total Conversations</p></div>
          <div><p className="text-2xl font-bold text-gray-900">{leads.length}</p><p className="text-xs text-gray-400">Total Leads</p></div>
          <div><p className="text-2xl font-bold text-gray-900">{bookedLeads}</p><p className="text-xs text-gray-400">Booked Leads</p></div>
          <div><p className="text-2xl font-bold text-gray-900">{aiActive}</p><p className="text-xs text-gray-400">AI Active</p></div>
          <div className="col-span-2"><p className="text-2xl font-bold text-gray-900">{totalMessages}</p><p className="text-xs text-gray-400">Total Messages</p></div>
        </div>
      </div>
    </div>
  )
}

export function OverviewPage() {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange)

  // Primary: webhook calls (always available, near real-time)
  const { data: webhookData, isFetching: wFetching } = useWebhookCalls({ limit: 1000 })
  // Supplemental: Sarvam API (may fail if proxy broken, that's OK)
  const { data: interactionsData, isFetching: iFetching } = useInteractions(dateRange)
  const { data: attemptsData, isFetching: aFetching } = useAttempts(dateRange)

  // Merge: start with webhook calls, supplement with Sarvam if available
  const webhookCalls = webhookData?.items ?? []
  const sarvamInteractions = interactionsData?.items ?? []

  // Use Sarvam data if available (proxy working), otherwise use webhook data
  const interactions: Interaction[] = sarvamInteractions.length > 0
    ? sarvamInteractions
    : webhookCalls.map(webhookToInteraction)

  const attempts = attemptsData?.items ?? []

  const stats = useMemo(() => {
    const totalInteractions = sarvamInteractions.length > 0
      ? (interactionsData?.total ?? sarvamInteractions.length)
      : webhookCalls.length

    const totalAttempts = attemptsData?.total ?? attempts.length

    const connectedAttempts = attempts.filter(a => a.connectivity_status === 'connected').length
    const connectionRate = totalAttempts > 0
      ? ((connectedAttempts / totalAttempts) * 100).toFixed(1)
      : webhookCalls.length > 0 ? '100' : '0'  // webhook calls are always connected

    const avgDuration = interactions.length > 0
      ? Math.round(interactions.reduce((s, i) => s + (i.duration_in_seconds ?? 0), 0) / interactions.length)
      : 0

    const successGoals = interactions.filter(i =>
      i.goal_overall_status === 'success' ||
      i.goal_overall_status === 'completed' ||
      i.goal_overall_status === 'enrolled' ||
      i.goal_overall_status === 'interested' ||
      i.goal_overall_status === 'query_resolved'
    ).length
    const successRate = interactions.length > 0
      ? ((successGoals / interactions.length) * 100).toFixed(1)
      : '0'

    const today = format(new Date(), 'yyyy-MM-dd')
    const callsToday = interactions.filter(i => {
      const d = i.started_at ?? i.created_at ?? ''
      return d.startsWith(today)
    }).length

    // Also count webhook calls today (in case Sarvam API is not working)
    const webhookToday = sarvamInteractions.length === 0
      ? webhookCalls.filter(c => {
          const d = c.start_datetime ?? c.received_at ?? ''
          return d.startsWith(today)
        }).length
      : callsToday

    const avgTurns = interactions.length > 0
      ? Math.round(interactions.reduce((s, i) => s + (i.num_messages ?? 0), 0) / interactions.length)
      : 0

    // Total minutes
    const totalMinutes = interactions.length > 0
      ? Math.round(interactions.reduce((s, i) => s + (i.duration_in_seconds ?? 0), 0) / 60)
      : Math.round(webhookCalls.reduce((s, c) => s + (c.duration ?? 0), 0) / 60)

    return {
      totalInteractions,
      totalAttempts: totalAttempts || webhookCalls.length,
      connectionRate,
      avgDuration,
      successRate,
      callsToday: webhookToday,
      avgTurns,
      totalMinutes,
      usingWebhookData: sarvamInteractions.length === 0,
    }
  }, [interactions, attempts, interactionsData, attemptsData, webhookCalls, sarvamInteractions])

  // Build calls per day using whichever data source has data
  const callsPerDay = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
    return days.map(day => {
      const label = formatDateShort(day)
      const dayStr = format(day, 'yyyy-MM-dd')

      const sarvamCount = sarvamInteractions.filter(i =>
        (i.started_at ?? i.created_at ?? '').startsWith(dayStr)
      ).length

      const webhookCount = webhookCalls.filter(c =>
        (c.start_datetime ?? c.received_at ?? '').startsWith(dayStr)
      ).length

      return { date: label, count: sarvamCount || webhookCount }
    })
  }, [sarvamInteractions, webhookCalls, dateRange])

  // Disposition breakdown from webhook calls
  const dispositionData = useMemo(() => {
    const map: Record<string, number> = {}
    webhookCalls.forEach(c => {
      if (c.call_disposition) map[c.call_disposition] = (map[c.call_disposition] ?? 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [webhookCalls])

  const endReasonData = useMemo(() => {
    const map: Record<string, number> = {}
    interactions.forEach(i => { if (i.end_reason) map[i.end_reason] = (map[i.end_reason] ?? 0) + 1 })
    // Fall back to disposition data from webhooks
    if (Object.keys(map).length === 0) {
      webhookCalls.forEach(c => { if (c.call_disposition) map[c.call_disposition] = (map[c.call_disposition] ?? 0) + 1 })
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [interactions, webhookCalls])

  const goalStatusData = useMemo(() => {
    const map: Record<string, number> = {}
    interactions.forEach(i => { if (i.goal_overall_status) map[i.goal_overall_status] = (map[i.goal_overall_status] ?? 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [interactions])

  const isFetching = wFetching || iFetching || aFetching

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-4 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your calls and agent performance — Carmel College of Nursing</p>
        </div>
        <div className="flex items-center gap-3">
          {isFetching && <span className="text-xs text-green-600 animate-pulse font-medium">Refreshing…</span>}
          {stats.usingWebhookData && webhookCalls.length > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              ⚡ Live data
            </span>
          )}
        </div>
      </div>

      <DateRangePicker value={dateRange} onChange={setDateRange} />

      {/* KPI row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Interactions"
          value={stats.totalInteractions}
          delta={{ value: 'this period', positive: true }}
          periodLabel=""
          miniChart={
            <ResponsiveContainer width={60} height={40}>
              <BarChart data={callsPerDay.slice(-7)} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Bar dataKey="count" fill="#4CAF50" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          }
        />
        <StatCard
          title="Picked-up Rate"
          value={`${stats.connectionRate}%`}
          delta={{ value: `${stats.connectionRate}% connected`, positive: parseFloat(stats.connectionRate) >= 50 }}
          miniChart={
            <ResponsiveContainer width={60} height={40}>
              <PieChart>
                <Pie
                  data={[{ v: parseFloat(stats.connectionRate) }, { v: Math.max(0, 100 - parseFloat(stats.connectionRate)) }]}
                  dataKey="v" cx="50%" cy="50%" innerRadius={12} outerRadius={20} startAngle={90} endAngle={-270}
                >
                  <Cell fill="#4CAF50" /><Cell fill="#e8f5e9" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          }
        />
        <StatCard
          title="Goal Success Rate"
          value={`${stats.successRate}%`}
          delta={{ value: `${stats.successRate}% success`, positive: parseFloat(stats.successRate) >= 50 }}
          miniChart={
            <ResponsiveContainer width={60} height={40}>
              <PieChart>
                <Pie
                  data={[{ v: parseFloat(stats.successRate) }, { v: Math.max(0, 100 - parseFloat(stats.successRate)) }]}
                  dataKey="v" cx="50%" cy="50%" innerRadius={12} outerRadius={20} startAngle={90} endAngle={-270}
                >
                  <Cell fill="#4CAF50" /><Cell fill="#e8f5e9" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          }
        />
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Avg Duration"    value={formatDuration(stats.avgDuration)} subtitle="per call" />
        <StatCard title="Calls Today"     value={stats.callsToday}                  subtitle="today" />
        <StatCard title="Total Attempts"  value={stats.totalAttempts}               subtitle="all attempts" />
        <StatCard title="Total Minutes"   value={`${stats.totalMinutes}m`}          subtitle="billed" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Calls Per Day</h3>
            <span className="text-xs text-gray-400">Last {callsPerDay.length} days</span>
          </div>
          <CallsPerDayChart data={callsPerDay} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-gray-900 self-start mb-3">Call Performance</h3>
          <RadialBarChart width={140} height={140} cx={70} cy={70} innerRadius={45} outerRadius={65}
            data={[{ value: parseFloat(stats.successRate), fill: '#4CAF50' }]} startAngle={180} endAngle={-180}>
            <RadialBar dataKey="value" cornerRadius={6} background={{ fill: '#e8f5e9' }} />
          </RadialBarChart>
          <p className="-mt-4 text-3xl font-bold text-gray-900">{stats.successRate}%</p>
          <p className="text-xs text-gray-400 mt-1">Goal Success Rate</p>
          <div className="grid grid-cols-2 gap-3 mt-4 w-full text-center">
            <div>
              <p className="text-lg font-bold text-gray-900">{stats.totalInteractions}</p>
              <p className="text-xs text-gray-400">Total Calls</p>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{formatDuration(stats.avgDuration)}</p>
              <p className="text-xs text-gray-400">Avg Duration</p>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">End Reason / Disposition</h3>
          {endReasonData.length > 0 ? <EndReasonChart data={endReasonData} /> : <p className="text-sm text-gray-400 py-8 text-center">No data yet</p>}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Goal Status</h3>
          {goalStatusData.length > 0 ? <GoalStatusChart data={goalStatusData} /> : (
            dispositionData.length > 0 ? <GoalStatusChart data={dispositionData} /> :
            <p className="text-sm text-gray-400 py-8 text-center">No data yet</p>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Call Disposition</h3>
          {dispositionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={dispositionData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {dispositionData.map((_e, i) => <Cell key={i} fill={OUTCOME_COLORS[i % OUTCOME_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [v, 'Calls']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400 py-8 text-center">No data yet</p>}
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Call Activity</h3>
        <div className="flex flex-wrap gap-1">
          {callsPerDay.map((d, i) => {
            const maxCount = Math.max(...callsPerDay.map(x => x.count), 1)
            const intensity = d.count === 0 ? 0 : Math.ceil((d.count / maxCount) * 6)
            const bgColors = ['bg-gray-100','bg-green-100','bg-green-200','bg-green-300','bg-green-400','bg-green-500','bg-green-700']
            return <div key={i} title={`${d.date}: ${d.count} calls`}
              className={`w-6 h-6 rounded-sm ${bgColors[intensity]} cursor-pointer hover:ring-2 hover:ring-green-400`} />
          })}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-gray-400">Less</span>
          {['bg-gray-100','bg-green-100','bg-green-200','bg-green-400','bg-green-600'].map((c,i) => (
            <div key={i} className={`w-4 h-4 rounded-sm ${c}`} />
          ))}
          <span className="text-xs text-gray-400">More</span>
        </div>
      </div>

      <WhatsAppQuickSection />
    </div>
  )
}
