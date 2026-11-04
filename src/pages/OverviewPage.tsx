import React, { useMemo, useState } from 'react'
import { useInteractions } from '../hooks/useInteractions'
import { useAttempts } from '../hooks/useAttempts'
import { StatCard } from '../components/StatCard'
import { DateRangePicker } from '../components/DateRangePicker'
import { CallsPerDayChart } from '../components/charts/CallsPerDayChart'
import { EndReasonChart } from '../components/charts/EndReasonChart'
import { GoalStatusChart } from '../components/charts/GoalStatusChart'
import { DateRange } from '../types'
import { defaultDateRange, formatDuration, formatDateShort } from '../utils/dateUtils'
import { format, eachDayOfInterval } from 'date-fns'
import {
  RadialBarChart, RadialBar, BarChart, Bar, Cell, ResponsiveContainer,
  PieChart, Pie, Tooltip, Legend
} from 'recharts'

const OUTCOME_COLORS = ['#4CAF50', '#ef4444', '#f59e0b', '#6366f1', '#94a3b8']

export function OverviewPage() {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange)

  const { data: interactionsData, isFetching: iFetching } = useInteractions(dateRange)
  const { data: attemptsData, isFetching: aFetching } = useAttempts(dateRange)

  const interactions = interactionsData?.items ?? []
  const attempts = attemptsData?.items ?? []

  const stats = useMemo(() => {
    const totalInteractions = interactionsData?.total ?? interactions.length
    const totalAttempts = attemptsData?.total ?? attempts.length
    const connectedAttempts = attempts.filter((a) => a.connectivity_status === 'connected').length
    const connectionRate =
      totalAttempts > 0 ? ((connectedAttempts / totalAttempts) * 100).toFixed(1) : '0'
    const avgDuration =
      interactions.length > 0
        ? Math.round(
            interactions.reduce((s, i) => s + (i.duration_in_seconds ?? 0), 0) /
              interactions.length
          )
        : 0
    const successGoals = interactions.filter(
      (i) => i.goal_overall_status === 'success' || i.goal_overall_status === 'completed'
    ).length
    const successRate =
      interactions.length > 0
        ? ((successGoals / interactions.length) * 100).toFixed(1)
        : '0'
    const today = format(new Date(), 'yyyy-MM-dd')
    const callsToday = interactions.filter((i) => {
      const d = i.started_at ?? i.created_at ?? ''
      return d.startsWith(today)
    }).length

    const avgTurns =
      interactions.length > 0
        ? Math.round(
            interactions.reduce((s, i) => s + (i.num_messages ?? 0), 0) / interactions.length
          )
        : 0

    return {
      totalInteractions,
      totalAttempts,
      connectionRate,
      avgDuration,
      successRate,
      callsToday,
      avgTurns,
    }
  }, [interactions, attempts, interactionsData, attemptsData])

  const callsPerDay = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end })
    return days.map((day) => {
      const label = formatDateShort(day)
      const dayStr = format(day, 'yyyy-MM-dd')
      const count = interactions.filter((i) => {
        const d = i.started_at ?? i.created_at ?? ''
        return d.startsWith(dayStr)
      }).length
      return { date: label, count }
    })
  }, [interactions, dateRange])

  const endReasonData = useMemo(() => {
    const map: Record<string, number> = {}
    interactions.forEach((i) => {
      if (i.end_reason) map[i.end_reason] = (map[i.end_reason] ?? 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [interactions])

  const goalStatusData = useMemo(() => {
    const map: Record<string, number> = {}
    interactions.forEach((i) => {
      if (i.goal_overall_status)
        map[i.goal_overall_status] = (map[i.goal_overall_status] ?? 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [interactions])

  const callOutcomesData = useMemo(() => {
    const map: Record<string, number> = {
      Answered: 0,
      'Not Picked': 0,
      Busy: 0,
      Failed: 0,
      Other: 0,
    }
    attempts.forEach((a) => {
      const s = (a.connectivity_status ?? '').toLowerCase()
      const f = (a.failure_reason ?? '').toLowerCase()
      if (s === 'connected') map['Answered']++
      else if (
        f.includes('not_picked') ||
        f.includes('no_answer') ||
        s === 'not_picked'
      )
        map['Not Picked']++
      else if (f.includes('busy') || s === 'busy') map['Busy']++
      else if (s === 'failed' || f.includes('failed')) map['Failed']++
      else map['Other']++
    })
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }))
  }, [attempts])

  const isFetching = iFetching || aFetching

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap gap-4 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your calls and agent performance — Carmel College of Nursing</p>
        </div>
        <div className="flex items-center gap-3">
          {isFetching && <span className="text-xs text-green-600 animate-pulse font-medium">Refreshing…</span>}
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
                  data={[{ v: parseFloat(stats.connectionRate) }, { v: 100 - parseFloat(stats.connectionRate) }]}
                  dataKey="v"
                  cx="50%"
                  cy="50%"
                  innerRadius={12}
                  outerRadius={20}
                  startAngle={90}
                  endAngle={-270}
                >
                  <Cell fill="#4CAF50" />
                  <Cell fill="#e8f5e9" />
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
                  data={[{ v: parseFloat(stats.successRate) }, { v: 100 - parseFloat(stats.successRate) }]}
                  dataKey="v"
                  cx="50%"
                  cy="50%"
                  innerRadius={12}
                  outerRadius={20}
                  startAngle={90}
                  endAngle={-270}
                >
                  <Cell fill="#4CAF50" />
                  <Cell fill="#e8f5e9" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          }
        />
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Avg Duration" value={formatDuration(stats.avgDuration)} subtitle="per call" />
        <StatCard title="Calls Today" value={stats.callsToday} subtitle="today" />
        <StatCard title="Total Attempts" value={stats.totalAttempts} subtitle="all attempts" />
        <StatCard title="Avg Turns" value={stats.avgTurns} subtitle="per call" />
      </div>

      {/* Charts row */}
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
          <RadialBarChart
            width={140}
            height={140}
            cx={70}
            cy={70}
            innerRadius={45}
            outerRadius={65}
            data={[{ value: parseFloat(stats.successRate), fill: '#4CAF50' }]}
            startAngle={180}
            endAngle={-180}
          >
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
          <h3 className="text-sm font-semibold text-gray-900 mb-3">End Reason</h3>
          {endReasonData.length > 0 ? <EndReasonChart data={endReasonData} /> : <p className="text-sm text-gray-400 py-8 text-center">No data</p>}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Goal Status</h3>
          {goalStatusData.length > 0 ? <GoalStatusChart data={goalStatusData} /> : <p className="text-sm text-gray-400 py-8 text-center">No data</p>}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Call Outcomes</h3>
          {callOutcomesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={callOutcomesData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {callOutcomesData.map((_entry: { name: string; value: number }, index: number) => (
                    <Cell key={`cell-${index}`} fill={OUTCOME_COLORS[index % OUTCOME_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Calls']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400 py-8 text-center">No data</p>}
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Call Activity Heatmap</h3>
        <div className="flex flex-wrap gap-1">
          {callsPerDay.map((d, i) => {
            const maxCount = Math.max(...callsPerDay.map((x) => x.count), 1)
            const intensity = d.count === 0 ? 0 : Math.ceil((d.count / maxCount) * 6)
            const bgColors = ['bg-gray-100', 'bg-green-100', 'bg-green-200', 'bg-green-300', 'bg-green-400', 'bg-green-500', 'bg-green-700']
            return (
              <div
                key={i}
                title={`${d.date}: ${d.count} calls`}
                className={`w-6 h-6 rounded-sm ${bgColors[intensity]} cursor-pointer hover:ring-2 hover:ring-green-400 hover:ring-offset-1`}
              />
            )
          })}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-gray-400">Less</span>
          {['bg-gray-100', 'bg-green-100', 'bg-green-200', 'bg-green-400', 'bg-green-600'].map((c, i) => (
            <div key={i} className={`w-4 h-4 rounded-sm ${c}`} />
          ))}
          <span className="text-xs text-gray-400">More</span>
        </div>
      </div>
    </div>
  )
}
