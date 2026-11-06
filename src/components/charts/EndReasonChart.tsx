import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface Props { data: { name: string; value: number }[] }
const COLORS = ['#1f6b47','#a6e22e','#f0883e','#7b857f','#124530']

export function EndReasonChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
          {data.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{background:'#fff',border:'1px solid #e8ebe8',borderRadius:10,fontSize:12}} />
      </PieChart>
    </ResponsiveContainer>
  )
}
