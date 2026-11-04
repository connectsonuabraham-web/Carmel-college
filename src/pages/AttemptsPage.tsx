import React, { useState } from 'react'
import { useAttempts } from '../hooks/useAttempts'
import { AttemptsTable } from '../components/AttemptsTable'
import { DateRangePicker } from '../components/DateRangePicker'
import { DateRange } from '../types'
import { defaultDateRange } from '../utils/dateUtils'

export function AttemptsPage() {
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange)
  const { data, isFetching } = useAttempts(dateRange)
  const attempts = data?.items ?? []

  const connected = attempts.filter((a) => a.connectivity_status === 'connected').length
  const rate = attempts.length > 0 ? ((connected / attempts.length) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-4 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attempts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data?.total ?? 0} attempts · {rate}% connection rate</p>
        </div>
        <div className="flex items-center gap-3">
          {isFetching && <span className="text-xs text-green-600 animate-pulse font-medium">Refreshing…</span>}
        </div>
      </div>
      <DateRangePicker value={dateRange} onChange={setDateRange} />
      <AttemptsTable attempts={attempts} isLoading={isFetching} />
    </div>
  )
}
