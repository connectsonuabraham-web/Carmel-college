import React from 'react'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'

interface Delta {
  value: string
  positive: boolean
}

interface StatCardProps {
  title: string
  value: string | number
  delta?: Delta
  miniChart?: React.ReactNode
  periodLabel?: string
  onSeeDetails?: () => void
  color?: string
  subtitle?: string
  icon?: React.ReactNode
}

export function StatCard({ title, value, delta, miniChart, periodLabel, onSeeDetails, subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        {miniChart && <div className="flex-shrink-0">{miniChart}</div>}
      </div>
      <p className="text-3xl font-bold text-gray-900 leading-none mb-2">{value}</p>
      {(delta || subtitle) && (
        <div className="flex items-center gap-1.5 text-xs">
          {delta && (
            <>
              {delta.positive ? (
                <TrendingUp size={12} className="text-green-500" />
              ) : (
                <TrendingDown size={12} className="text-red-500" />
              )}
              <span className={delta.positive ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
                {delta.value}
              </span>
            </>
          )}
          {periodLabel && <span className="text-gray-400">{periodLabel}</span>}
          {subtitle && !delta && <span className="text-gray-400">{subtitle}</span>}
        </div>
      )}
      {onSeeDetails && (
        <div className="border-t border-gray-100 pt-3 mt-auto mt-4">
          <button
            onClick={onSeeDetails}
            className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700"
          >
            See Details <ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
