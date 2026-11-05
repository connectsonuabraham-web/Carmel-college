import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { date: string; avgDuration: number }[]
}

export function AvgDurationChart({ data }: Props) {
  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{top: 5, right: 20, left: 0, bottom: 5}}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{fill: '#475569', fontSize: 11}} axisLine={{stroke: 'rgba(255,255,255,0.06)'}} tickLine={false} />
          <YAxis tickFormatter={(v) => `${Math.floor(v/60)}m`} tick={{fill: '#475569', fontSize: 11}} axisLine={{stroke: 'rgba(255,255,255,0.06)'}} tickLine={false} />
          <Tooltip
            formatter={(v: number) => [`${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`, 'Avg Duration']}
            contentStyle={{backgroundColor: '#1a1d2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#f1f5f9', fontSize: 12}}
            labelStyle={{color: '#94a3b8'}}
            itemStyle={{color: '#f1f5f9'}}
          />
          <Line type="monotone" dataKey="avgDuration" name="Avg Duration" stroke="#22c55e" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
