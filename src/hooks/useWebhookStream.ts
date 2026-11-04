/**
 * useWebhookStream
 * ─────────────────
 * Opens a Server-Sent Events connection to the local webhook server.
 * When a new call arrives via Sarvam webhook, it instantly invalidates
 * the React Query cache so the dashboard refreshes without waiting 60s.
 *
 * The webhook server must be running: `node webhook-server/server.js`
 */
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

const WEBHOOK_SERVER = 'https://darkslategray-giraffe-469443.hostingersite.com'

export interface WebhookCall {
  source: 'inbound' | 'campaign' | 'outbound'
  received_at: string
  interaction_id: string | null
  attempt_id: string | null
  status: string
  duration: number | null
  user_phone_number: string | null
  agent_phone_number: string | null
  final_agent_variables: Record<string, unknown> | null
  failure_reason: string | null
  transcript: Array<{ role: string; en_text: string }> | null
  app_id: string | null
  start_datetime: string | null
  end_datetime: string | null
}

export type WebhookStatus = 'connecting' | 'connected' | 'disconnected' | 'unavailable'

export function useWebhookStream() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<WebhookStatus>('connecting')
  const [recentCalls, setRecentCalls] = useState<WebhookCall[]>([])
  const [lastCall, setLastCall] = useState<WebhookCall | null>(null)

  useEffect(() => {
    let es: EventSource | null = null
    let retryTimer: ReturnType<typeof setTimeout>
    let cancelled = false

    function connect() {
      if (cancelled) return
      setStatus('connecting')

      try {
        es = new EventSource(`${WEBHOOK_SERVER}/events`)

        es.addEventListener('open', () => {
          if (!cancelled) setStatus('connected')
        })

        // Initial history dump on connect
        es.addEventListener('history', (e: MessageEvent) => {
          try {
            const history: WebhookCall[] = JSON.parse(e.data)
            setRecentCalls(history.slice(0, 50))
          } catch (_) {}
        })

        // New call arrives in real time
        es.addEventListener('new_call', (e: MessageEvent) => {
          try {
            const call: WebhookCall = JSON.parse(e.data)
            setLastCall(call)
            setRecentCalls(prev => [call, ...prev].slice(0, 50))

            // Immediately invalidate all analytics queries so the
            // Calls page, Overview, and charts all refresh right away
            queryClient.invalidateQueries({ queryKey: ['interactions'] })
            queryClient.invalidateQueries({ queryKey: ['attempts'] })
          } catch (_) {}
        })

        es.addEventListener('error', () => {
          if (cancelled) return
          es?.close()
          setStatus('disconnected')
          // Retry after 5 seconds
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
