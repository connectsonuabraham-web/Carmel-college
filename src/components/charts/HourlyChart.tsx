import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props { data: { hour: string; count: number }[] }

export function HourlyChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={data} margin={{top:5,right:10,left:-10,bottom:5}}>
        <CartesianGrid stroke="#e8ebe8" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="hour" tick={{fill:'#7b857f',fontSize:10}} axisLine={false} tickLine={false} />
        <YAxis tick={{fill:'#7b857f',fontSize:11}} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{background:'#fff',border:'1px solid #e8ebe8',borderRadius:10,fontSize:12}} cursor={{fill:'#f5f6f4'}} />
        <Bar dataKey="count" name="Calls" fill="#124530" radius={[3,3,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
