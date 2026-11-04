import React from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#4CAF50', '#81C784', '#a5d6a7', '#ef4444', '#f59e0b', '#388E3C']

interface Props {
  data: { name: string; value: number }[]
}

export function EndReasonChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{fontSize: 11}} />
      </PieChart>
    </ResponsiveContainer>
  )
}
