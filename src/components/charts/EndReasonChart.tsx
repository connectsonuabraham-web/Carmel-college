import React from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#22c55e', '#6366f1', '#f59e0b', '#94a3b8']

interface Props {
  data: { name: string; value: number }[]
}

export function EndReasonChart({ data }: Props) {
  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} fill="#22c55e">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip
            contentStyle={{backgroundColor: '#1a1d2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#f1f5f9', fontSize: 12}}
            labelStyle={{color: '#94a3b8'}}
            itemStyle={{color: '#f1f5f9'}}
          />
          <Legend wrapperStyle={{fontSize: 11}} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
