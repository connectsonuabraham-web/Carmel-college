import React from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS: Record<string, string> = {
  success: '#4CAF50',
  failed: '#ef4444',
  incomplete: '#f59e0b',
  default: '#6b7280',
}

interface Props {
  data: { name: string; value: number }[]
}

export function GoalStatusChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
          {data.map((entry, i) => (
            <Cell key={i} fill={COLORS[entry.name] ?? COLORS.default} />
          ))}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{fontSize: 11}} />
      </PieChart>
    </ResponsiveContainer>
  )
}
