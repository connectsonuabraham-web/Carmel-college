import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { date: string; count: number }[]
}

export function CallsPerDayChart({ data }: Props) {
  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{top: 5, right: 20, left: 0, bottom: 5}}>
          <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{fill: '#475569', fontSize: 11}} axisLine={{stroke: 'rgba(255,255,255,0.06)'}} tickLine={false} />
          <YAxis tick={{fill: '#475569', fontSize: 11}} axisLine={{stroke: 'rgba(255,255,255,0.06)'}} tickLine={false} />
          <Tooltip
            contentStyle={{backgroundColor: '#1a1d2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#f1f5f9', fontSize: 12}}
            labelStyle={{color: '#94a3b8'}}
            itemStyle={{color: '#f1f5f9'}}
          />
          <Bar dataKey="count" name="Calls" fill="#22c55e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
