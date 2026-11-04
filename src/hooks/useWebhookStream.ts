/**
 * useWebhookStream
 * ─────────────────
 * Polls /api/webhook/calls every 10 seconds for new calls and invalidates
 * React Query cache so the dashboard updates immediately.
 *
 * SSE is not used because Vercel serverless functions don't support
 * long-lived connections. Polling every 10s is fast enough for a dashboard.
 */
import { useEffect, useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export interface WebhookCall {
  interaction_id:   string | null
  received_at:      string
  status?:          string
  duration:         number | null
  user_phone_number:  string | null
  agent_phone_number: string | null
  final_agent_variables: Record<string, unknown> | null
  call_summary:      string | null
  call_disposition:  string | null
  start_datetime:    string | null
  end_datetime:      string | null
}

export type WebhookStatus = 'connected' | 'disconnected' | 'unavailable'

export function useWebhookStream() {
  const queryClient  = useQueryClient()
  const [status, setStatus]           = useState<WebhookStatus>('disconnected')
  const [recentCalls, setRecentCalls] = useState<WebhookCall[]>([])
  const [lastCall, setLastCall]       = useState<WebhookCall | null>(null)
  const lastCountRef = useRef<number>(0)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const res = await fetch('/api/webhook/calls?limit=50')
        if (!res.ok) throw new Error(`${res.status}`)
        const data = await res.json()
        if (cancelled) return

        setStatus('connected')
        const items: WebhookCall[] = data.items ?? []
        setRecentCalls(items)

        // If there are more calls than last time, invalidate queries
        if (items.length > lastCountRef.current) {
          const newest = items[0]
          if (newest) setLastCall(newest)
          queryClient.invalidateQueries({ queryKey: ['interactions'] })
          queryClient.invalidateQueries({ queryKey: ['attempts'] })
          queryClient.invalidateQueries({ queryKey: ['webhook-calls'] })
        }
        lastCountRef.current = items.length
      } catch {
        if (!cancelled) setStatus('unavailable')
      }
    }

    // Poll immediately, then every 10 seconds
    poll()
    const id = setInterval(poll, 10000)

    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [queryClient])

  return { status, recentCalls, lastCall }
}
