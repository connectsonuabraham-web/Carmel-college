import React from 'react'

interface Props {
  title: string
  value: string | number
  subtitle?: string
  delta?: { value: string; positive: boolean }
  miniChart?: React.ReactNode
  periodLabel?: string
  dark?: boolean
}

export function StatCard({ title, value, subtitle, delta, miniChart, dark }: Props) {
  if (dark) {    return (
      <div style={{
        background: '#0b3322', color: '#fff', borderRadius: 20, padding: 18, minWidth: 0,
      }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#a9c9b6', marginBottom: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a6e22e' }} />
          {title}
        </div>
        <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.25, margin: '10px 0 14px', maxWidth: 200 }}>
          {value}
        </div>
        {delta && (
          <span style={{ color: '#a6e22e', fontWeight: 600, fontSize: 11.5 }}>
            {delta.value}
          </span>
        )}
        {subtitle && <div style={{ color: '#a9c9b6', fontSize: 11.5, marginTop: 4 }}>{subtitle}</div>}
      </div>
    )
  }

  return (
    <div style={{
      background: '#fff', border: '1px solid #e8ebe8', borderRadius: 20,
      padding: 18, minWidth: 0,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        color: '#7b857f', fontWeight: 500, fontSize: 13, marginBottom: 4,
      }}>
        <span>{title}</span>
        {miniChart && <div style={{ opacity: 0.7 }}>{miniChart}</div>}
      </div>
      <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', color: '#0f1a14', margin: '6px 0 8px' }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {delta && (
          <span style={{
            color: delta.positive ? '#1f6b47' : '#d9534f',
            fontWeight: 600, fontSize: 11.5,
          }}>
            {delta.positive ? '↑' : '↓'} {delta.value}
          </span>
        )}
        {subtitle && <span style={{ color: '#7b857f', fontSize: 11.5 }}>{subtitle}</span>}
      </div>
    </div>
  )
}
