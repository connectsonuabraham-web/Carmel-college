import React from 'react'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  delta?: { value: string; positive: boolean }
  miniChart?: React.ReactNode
  periodLabel?: string
  icon?: React.ReactNode
}

export function StatCard({ title, value, subtitle, delta, miniChart, icon }: Props) {
  return (
    <div className="bg-[#1a1d2e] border border-white/[0.06] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#475569]">{title}</p>
        {icon && <div className="text-[#475569]">{icon}</div>}
        {miniChart && !icon && <div className="opacity-70">{miniChart}</div>}
      </div>
      <p className="text-3xl font-bold text-[#f1f5f9] leading-none">{value}</p>
      <div className="flex items-center gap-2">
        {delta && (
          <span className={`text-xs font-medium ${delta.positive ? 'text-green-400' : 'text-red-400'}`}>
            {delta.positive ? '↑' : '↓'} {delta.value}
          </span>
        )}
        {subtitle && <span className="text-xs text-[#475569]">{subtitle}</span>}
      </div>
    </div>
  )
}

export default StatCard
