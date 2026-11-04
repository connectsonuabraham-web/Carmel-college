import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props {
  data: { name: string; count: number }[]
}

export function FailureReasonsChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{top: 5, right: 20, left: 100, bottom: 5}}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" tick={{fontSize: 11}} />
        <YAxis dataKey="name" type="category" tick={{fontSize: 11}} />
        <Tooltip />
        <Bar dataKey="count" name="Count" fill="#f87171" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
