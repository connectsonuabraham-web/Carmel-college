import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props { data: { date: string; avgDuration: number }[] }

export function AvgDurationChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={data} margin={{top:5,right:10,left:-10,bottom:5}}>
        <CartesianGrid stroke="#e8ebe8" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" tick={{fill:'#7b857f',fontSize:11}} axisLine={false} tickLine={false} />
        <YAxis tick={{fill:'#7b857f',fontSize:11}} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{background:'#fff',border:'1px solid #e8ebe8',borderRadius:10,fontSize:12}} cursor={{fill:'#f5f6f4'}} />
        <Bar dataKey="avgDuration" name="Avg Duration (s)" fill="#a6e22e" radius={[5,5,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
