/**
 * useWebhookStream
 * ─────────────────
 * Connects to the Express SSE endpoint at /events for instant push updates.
 * When Sarvam posts a new call to the server, the dashboard receives it
 * immediately via SSE and invalidates React Query cache.
 *
 * Falls back to polling if SSE fails.
 */
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export interface WebhookCall {
  interaction_id:    string | null
  received_at:       string
  duration:          number | null
  user_phone_number: string | null
  final_agent_variables: Record<string, unknown> | null
  call_summary:      string | null
  call_disposition:  string | null
  start_datetime:    string | null
}

export type WebhookStatus = 'connecting' | 'connected' | 'disconnected' | 'unavailable'

export function useWebhookStream() {
  const queryClient  = useQueryClient()
  const [status,      setStatus]      = useState<WebhookStatus>('connecting')
  const [recentCalls, setRecentCalls] = useState<WebhookCall[]>([])
  const [lastCall,    setLastCall]    = useState<WebhookCall | null>(null)

  useEffect(() => {
    let es: EventSource | null = null
    let retryTimer: ReturnType<typeof setTimeout>
    let cancelled = false

    function connect() {
      if (cancelled) return
      setStatus('connecting')

      try {
        es = new EventSource('/events')

        es.addEventListener('open', () => {
          if (!cancelled) setStatus('connected')
        })

        es.addEventListener('history', (e: MessageEvent) => {
          try {
            const history: WebhookCall[] = JSON.parse(e.data)
            setRecentCalls(history.slice(0, 50))
          } catch (_) {}
        })

        es.addEventListener('new_call', (e: MessageEvent) => {
          try {
            const call: WebhookCall = JSON.parse(e.data)
            setLastCall(call)
            setRecentCalls(prev => [call, ...prev].slice(0, 50))
            queryClient.invalidateQueries({ queryKey: ['interactions'] })
            queryClient.invalidateQueries({ queryKey: ['attempts'] })
            queryClient.invalidateQueries({ queryKey: ['webhook-calls'] })
          } catch (_) {}
        })

        es.addEventListener('error', () => {
          if (cancelled) return
          es?.close()
          setStatus('disconnected')
          retryTimer = setTimeout(connect, 5000)
        })
      } catch (_) {
        setStatus('unavailable')
      }
    }

    connect()
    return () => {
      cancelled = true
      clearTimeout(retryTimer)
      es?.close()
    }
  }, [queryClient])

  return { status, recentCalls, lastCall }
}
