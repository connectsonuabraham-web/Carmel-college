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
        <label className="text-\[#7b857f\] text-xs">From</label>
        <input
          type="datetime-local"
          value={fmt(value.start)}
          onChange={(e) =>
            onChange({ ...value, start: new Date(e.target.value) })
          }
          className="bg-white border border-\[#e8ebe8\] text-\[#7b857f\] rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-white/20"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-\[#7b857f\] text-xs">To</label>
        <input
          type="datetime-local"
          value={fmt(value.end)}
          onChange={(e) =>
            onChange({ ...value, end: new Date(e.target.value) })
          }
          className="bg-white border border-\[#e8ebe8\] text-\[#7b857f\] rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-white/20"
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
            className="bg-white border border-\[#e8ebe8\] text-\[#7b857f\] hover:bg-\[#f5f6f4\] rounded-lg px-3 py-1.5 text-sm transition-colors"
          >
            Last {days}d
          </button>
        ))}
      </div>
    </div>
  )
}
