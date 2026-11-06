import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface Props { data: { name: string; value: number }[] }

export function FailureReasonsChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={data} layout="vertical" margin={{top:5,right:10,left:10,bottom:5}}>
        <CartesianGrid stroke="#e8ebe8" strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={{fill:'#7b857f',fontSize:11}} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" tick={{fill:'#7b857f',fontSize:11}} axisLine={false} tickLine={false} width={90} />
        <Tooltip contentStyle={{background:'#fff',border:'1px solid #e8ebe8',borderRadius:10,fontSize:12}} cursor={{fill:'#f5f6f4'}} />
        <Bar dataKey="value" name="Count" fill="#d9534f" radius={[0,5,5,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
