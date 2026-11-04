import React from 'react'
import { format } from 'date-fns'
import { DateRange } from '../types'

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const fmt = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm")

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500">From</label>
        <input
          type="datetime-local"
          value={fmt(value.start)}
          onChange={(e) =>
            onChange({ ...value, start: new Date(e.target.value) })
          }
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500">To</label>
        <input
          type="datetime-local"
          value={fmt(value.end)}
          onChange={(e) =>
            onChange({ ...value, end: new Date(e.target.value) })
          }
          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400"
        />
      </div>
      <div className="flex gap-2">
        {[7, 14, 30].map((days) => (
          <button
            key={days}
            onClick={() => {
              const end = new Date()
              const start = new Date()
              start.setDate(start.getDate() - (days - 1))
              start.setHours(0, 0, 0, 0)
              onChange({ start, end })
            }}
            className="rounded-md bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 transition-colors"
          >
            Last {days}d
          </button>
        ))}
      </div>
    </div>
  )
}
