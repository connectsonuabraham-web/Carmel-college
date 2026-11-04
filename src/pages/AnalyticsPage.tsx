import React, { useState, useMemo } from 'react'
import { useInteractions } from '../hooks/useInteractions'
import { useAttempts } from '../hooks/useAttempts'
import { DateRangePicker } from '../components/DateRangePicker'
import { LanguageChart } from '../components/charts/LanguageChart'
import { HourlyChart } from '../components/charts/HourlyChart'
import { FailureReasonsChart } from '../components/charts/FailureReasonsChart'
import { EndReasonChart } from '../components/charts/EndReasonChart'
import { GoalStatusChart } from '../components/charts/GoalStatusChart'
import { DateRange } from '../types'
import { defaultDateRange } from '../utils/dateUtils'

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange)
  const { data: intData } = useInteractions(dateRange)
  const { data: attData } = useAttempts(dateRange)

  const interactions = intData?.items ?? []
  const attempts = attData?.items ?? []

  const languageData = useMemo(() => {
    const map: Record<string, number> = {}
    interactions.forEach((i) => { if (i.language_name) map[i.language_name] = (map[i.language_name] ?? 0) + 1 })
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
  }, [interactions])

  const hourlyData = useMemo(() => {
    const map: Record<number, number> = {}
    for (let h = 0; h < 24; h++) map[h] = 0
    interactions.forEach((i) => {
      const d = i.started_at ?? i.created_at
      if (d) { const h = new Date(d).getHours(); map[h] = (map[h] ?? 0) + 1 }
    })
    return Object.entries(map).map(([h, count]) => ({ hour: `${String(h).padStart(2, '0')}:00`, count }))
  }, [interactions])

  const failureData = useMemo(() => {
    const map: Record<string, number> = {}
    attempts.forEach((a) => { if (a.failure_reason) map[a.failure_reason] = (map[a.failure_reason] ?? 0) + 1 })
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10)
  }, [attempts])

  const directionData = useMemo(() => {
    const map: Record<string, number> = {}
    interactions.forEach((i) => { if (i.channel_direction) map[i.channel_direction] = (map[i.channel_direction] ?? 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [interactions])

  const goalData = useMemo(() => {
    const map: Record<string, number> = {}
    interactions.forEach((i) => { if (i.goal_overall_status) map[i.goal_overall_status] = (map[i.goal_overall_status] ?? 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [interactions])

  const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
      {children}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Detailed breakdown of agent performance</p>
      </div>
      <DateRangePicker value={dateRange} onChange={setDateRange} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Calls by Language">
          {languageData.length > 0 ? <LanguageChart data={languageData} /> : <p className="text-sm text-gray-400 py-8 text-center">No data</p>}
        </ChartCard>
        <ChartCard title="Hourly Call Distribution">
          <HourlyChart data={hourlyData} />
        </ChartCard>
        <ChartCard title="Calls by Direction">
          {directionData.length > 0 ? <EndReasonChart data={directionData} /> : <p className="text-sm text-gray-400 py-8 text-center">No data</p>}
        </ChartCard>
        <ChartCard title="Goal Success Rate">
          {goalData.length > 0 ? <GoalStatusChart data={goalData} /> : <p className="text-sm text-gray-400 py-8 text-center">No data</p>}
        </ChartCard>
        <ChartCard title="Top Failure Reasons">
          {failureData.length > 0 ? <FailureReasonsChart data={failureData} /> : <p className="text-sm text-gray-400 py-8 text-center">No failure data</p>}
        </ChartCard>
      </div>
    </div>
  )
}
