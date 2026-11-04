import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { date: string; avgDuration: number }[]
}

export function AvgDurationChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{top: 5, right: 20, left: 0, bottom: 5}}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" tick={{fontSize: 11}} />
        <YAxis tick={{fontSize: 11}} tickFormatter={(v) => `${Math.floor(v/60)}m`} />
        <Tooltip formatter={(v: number) => [`${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`, 'Avg Duration']} />
        <Line type="monotone" dataKey="avgDuration" name="Avg Duration" stroke="#4CAF50" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
