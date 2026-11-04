import React, { useState, useEffect, useRef } from 'react'
import {
  Phone, Clock, User, Play, Pause,
  ChevronLeft, ChevronRight, X, ExternalLink,
  CheckCircle2, XCircle, AlertCircle, Loader2,
  MessageSquare, Wrench, Bot, Volume2
} from 'lucide-react'
import { useWebhookCalls } from '../hooks/useWebhookCalls'
import { useQueryClient } from '@tanstack/react-query'
import { WebhookCall, WebhookTranscriptTurn } from '../types'
import { CONFIG } from '../config'

const PAGE_SIZE = 25

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(dt: string | null) {
  if (!dt) return '—'
  try { return new Date(dt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return dt }
}
function fmtDur(s: number | null) {
  if (s == null) return '—'
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`
}

function DispositionBadge({ d }: { d: string | null }) {
  if (!d) return <span className="text-gray-300 text-xs">—</span>
  const map: Record<string, string> = {
    interested:          'bg-green-100 text-green-700',
    not_interested:      'bg-red-100   text-red-700',
    callback:            'bg-yellow-100 text-yellow-700',
    busy_callback:       'bg-yellow-100 text-yellow-700',
    wrong_number:        'bg-gray-100  text-gray-600',
    enrolled:            'bg-green-200 text-green-800',
    transferred:         'bg-blue-100  text-blue-700',
    no_answer:           'bg-gray-100  text-gray-500',
  }
  const cls = map[d.toLowerCase()] ?? 'bg-gray-100 text-gray-600'
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize whitespace-nowrap ${cls}`}>{d.replace(/_/g,' ')}</span>
}

// ── Recording player modal ────────────────────────────────────────────────────
// Fetches recording from Sarvam Analytics API via the server-side proxy.
// recording_url from the webhook payload is usually null — Sarvam doesn't
// include it in webhooks. We fetch it using the interaction_id instead.
function RecordingModal({ call, onClose }: { call: WebhookCall; onClose: () => void }) {
  const [blobUrl,   setBlobUrl]   = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (!call.interaction_id) { setLoading(false); setError('No interaction ID'); return }
    setLoading(true); setError(null)

    // Encode the "/" in interaction_id as %2F
    const encodedId = call.interaction_id.replace('/', '%2F')
    const url = `/api/sarvam/${CONFIG.ORG_ID}/${CONFIG.WORKSPACE_ID}/${CONFIG.APP_ID}/recordings/${encodedId}`

    fetch(url)
      .then(async res => {
        if (res.status === 404) throw new Error('NO_RECORDING')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const ct  = res.headers.get('content-type') || 'audio/wav'
        const buf = await res.arrayBuffer()
        setBlobUrl(URL.createObjectURL(new Blob([buf], { type: ct })))
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))

    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, [call.interaction_id])

  const toggle = () => {
    if (!audioRef.current) return
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false) }
    else           { audioRef.current.play().catch(() => {}); setIsPlaying(true) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Call Recording</p>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{call.interaction_id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-4 text-xs text-gray-500 mb-4 flex-wrap">
          {call.user_phone_number && <span className="flex items-center gap-1"><User  size={11} />{call.user_phone_number}</span>}
          {call.duration != null  && <span className="flex items-center gap-1"><Clock size={11} />{fmtDur(call.duration)}</span>}
          {call.start_datetime    && <span className="flex items-center gap-1"><Phone size={11} />{fmt(call.start_datetime)}</span>}
        </div>

        {loading && (
          <div className="flex items-center gap-3 bg-green-50 rounded-xl px-4 py-4 border border-green-100">
            <Loader2 className="animate-spin text-green-500" size={18} />
            <p className="text-xs text-green-700">Fetching recording from Sarvam…</p>
          </div>
        )}

        {!loading && error === 'NO_RECORDING' && (
          <div className="bg-gray-50 rounded-xl border border-gray-100 px-4 py-6 text-center">
            <Volume2 size={24} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No recording for this call</p>
            <p className="text-xs text-gray-300 mt-1">The call may not have been recorded.</p>
          </div>
        )}

        {!loading && error && error !== 'NO_RECORDING' && (
          <div className="bg-red-50 rounded-xl border border-red-100 px-4 py-4">
            <p className="text-xs text-red-600 font-medium">Failed to load recording</p>
            <p className="text-xs text-red-400 mt-1">{error}</p>
          </div>
        )}

        {!loading && blobUrl && (
          <div className="bg-green-50 rounded-xl border border-green-100 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={toggle}
                className="w-9 h-9 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm transition-colors"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>
              <div className="flex-1">
                <p className="text-xs font-semibold text-green-800">Call Recording</p>
                <p className="text-[10px] text-green-600 mt-0.5">Dual-channel WAV · User (left) · Agent (right)</p>
              </div>
            </div>
            <div className="px-4 pb-4">
              <audio
                ref={audioRef}
                controls
                src={blobUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                className="w-full"
                style={{ accentColor: '#4CAF50' }}
              />
            </div>
            <div className="px-4 pb-3">
              <a href={blobUrl} download={`recording-${call.interaction_id?.replace('/','-')}.wav`}
                className="inline-flex items-center gap-1.5 text-xs text-green-700 hover:text-green-900 font-medium">
                <ExternalLink size={12} /> Download recording
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Transcript modal ──────────────────────────────────────────────────────────
function TranscriptModal({ call, onClose }: { call: WebhookCall; onClose: () => void }) {
  const turns = call.interaction_transcript

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Transcript</p>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{call.interaction_id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>

        {/* Summary bar */}
        {(call.call_summary || call.call_disposition) && (
          <div className="px-5 py-3 bg-green-50 border-b border-green-100 flex-shrink-0 space-y-1">
            {call.call_disposition && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-green-600 font-medium w-24 flex-shrink-0">Disposition</span>
                <DispositionBadge d={call.call_disposition} />
              </div>
            )}
            {call.call_summary && (
              <div className="flex items-start gap-2">
                <span className="text-xs text-green-600 font-medium w-24 flex-shrink-0">Summary</span>
                <p className="text-xs text-green-800">{call.call_summary}</p>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {!turns || turns.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No transcript available for this call</p>
          ) : (
            turns.map((turn: WebhookTranscriptTurn, i: number) => {
              const isUser = turn.role === 'user'
              return (
                <div key={i} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isUser ? 'bg-blue-100' : 'bg-green-100'}`}>
                    {isUser ? <User size={13} className="text-blue-600" /> : <Bot size={13} className="text-green-600" />}
                  </div>
                  <div className={`max-w-[78%] flex flex-col gap-0.5 ${isUser ? 'items-end' : ''}`}>
                    <span className="text-[10px] text-gray-400 px-1 capitalize">{turn.role}</span>
                    <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                    }`}>
                      {turn.en_text}
                      {turn.indic_text && turn.indic_text !== turn.en_text && (
                        <p className={`text-xs mt-1 opacity-70`}>{turn.indic_text}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ── Variables modal ───────────────────────────────────────────────────────────
function VariablesModal({ call, onClose }: { call: WebhookCall; onClose: () => void }) {
  const vars = call.final_agent_variables || {}
  const hasVars = Object.keys(vars).length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col z-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <p className="font-semibold text-gray-900 text-sm">Agent Variables</p>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{call.interaction_id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {!hasVars ? (
            <p className="text-sm text-gray-400 text-center py-6">No agent variables for this call</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(vars).map(([k, v]) => (
                <div key={k} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                  <span className="text-xs font-mono text-green-700 min-w-[160px] font-medium mt-0.5">{k}</span>
                  <span className={`text-xs break-all flex-1 ${
                    v === null || v === undefined ? 'text-gray-300 italic' : 'text-gray-800'
                  }`}>
                    {v === null || v === undefined
                      ? 'null'
                      : typeof v === 'object'
                        ? JSON.stringify(v)
                        : String(v)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
type ModalState =
  | { type: 'recording';   call: WebhookCall }
  | { type: 'transcript';  call: WebhookCall }
  | { type: 'variables';   call: WebhookCall }
  | null

export function WebhookCallsPage() {
  const [page,         setPage]         = useState(0)
  const [search,       setSearch]       = useState('')
  const [disposition,  setDisposition]  = useState('')
  const [modal,        setModal]        = useState<ModalState>(null)
  const queryClient = useQueryClient()

  const { data, isFetching, error } = useWebhookCalls({
    limit:  PAGE_SIZE,
    offset: page * PAGE_SIZE,
    search,
    disposition,
  })

  const calls      = data?.items  ?? []
  const total      = data?.total  ?? 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const inputCls = 'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400'

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-wrap gap-4 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Call Log</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {total > 0 ? `${total} calls received via webhook` : 'Calls received via Sarvam webhook in real time'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && <span className="text-xs text-green-600 animate-pulse">Refreshing…</span>}
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['webhook-calls'] })}
            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          placeholder="Search phone, name, summary, ID…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          className={`flex-1 min-w-[200px] ${inputCls}`}
        />
        <select
          value={disposition}
          onChange={e => { setDisposition(e.target.value); setPage(0) }}
          className={inputCls}
        >
          <option value="">All Dispositions</option>
          {['interested','not_interested','callback','busy_callback','enrolled','transferred','wrong_number','no_answer'].map(d => (
            <option key={d} value={d}>{d.replace(/_/g,' ')}</option>
          ))}
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700">Could not reach the webhook server</p>
            <p className="text-xs text-red-500 mt-0.5">Make sure <code className="bg-red-100 px-1 rounded">node webhook-server/server.js</code> is running on your Hostinger server.</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Date/Time','Caller','Duration','Disposition','Summary','Caller Name','Course','Transfer?','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isFetching && calls.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center">
                <Loader2 className="animate-spin text-green-400 mx-auto" size={22} />
              </td></tr>
            ) : calls.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-gray-400 text-sm">
                No calls yet. Calls will appear here as soon as the webhook receives them.
              </td></tr>
            ) : (
              calls.map(call => (
                <tr key={call.interaction_id} className="hover:bg-green-50 transition-colors">
                  {/* Date/Time */}
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                    {fmt(call.start_datetime ?? call.received_at)}
                  </td>

                  {/* Caller */}
                  <td className="px-4 py-3 font-mono text-xs text-gray-700 whitespace-nowrap">
                    {call.user_phone_number ?? '—'}
                  </td>

                  {/* Duration */}
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                    {fmtDur(call.duration)}
                  </td>

                  {/* Disposition */}
                  <td className="px-4 py-3">
                    <DispositionBadge d={call.call_disposition} />
                  </td>

                  {/* Summary */}
                  <td className="px-4 py-3 max-w-[220px]">
                    {call.call_summary
                      ? <p className="text-xs text-gray-600 truncate" title={call.call_summary}>{call.call_summary}</p>
                      : <span className="text-gray-300 text-xs">—</span>
                    }
                  </td>

                  {/* Caller Name */}
                  <td className="px-4 py-3 text-xs text-gray-700 whitespace-nowrap">
                    {call.caller_name ?? '—'}
                  </td>

                  {/* Course */}
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap max-w-[120px] truncate">
                    {call.course_interested_in ?? '—'}
                  </td>

                  {/* Human transfer */}
                  <td className="px-4 py-3 text-center">
                    {call.human_transfer_needed === true  || call.human_transfer_needed === 'true'
                      ? <span title="Transfer needed"><CheckCircle2 size={14} className="text-yellow-500 mx-auto" /></span>
                      : call.human_transfer_needed === false || call.human_transfer_needed === 'false'
                        ? <XCircle size={14} className="text-gray-300 mx-auto" />
                        : <span className="text-gray-300 text-xs">—</span>
                    }
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* Play recording */}
                      <button
                        onClick={() => setModal({ type: 'recording', call })}
                        title="Play recording"
                        className="p-1.5 rounded-lg transition-colors text-green-600 hover:bg-green-100"
                      >
                        <Play size={14} />
                      </button>

                      {/* Transcript */}
                      <button
                        onClick={() => setModal({ type: 'transcript', call })}
                        title="View transcript"
                        className="p-1.5 rounded-lg text-green-600 hover:bg-green-100 transition-colors"
                      >
                        <MessageSquare size={14} />
                      </button>

                      {/* Agent variables */}
                      <button
                        onClick={() => setModal({ type: 'variables', call })}
                        title="Agent variables"
                        className="p-1.5 rounded-lg text-purple-500 hover:bg-purple-50 transition-colors"
                      >
                        <Wrench size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-green-50 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-green-50 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {modal?.type === 'recording'  && <RecordingModal  call={modal.call} onClose={() => setModal(null)} />}
      {modal?.type === 'transcript' && <TranscriptModal call={modal.call} onClose={() => setModal(null)} />}
      {modal?.type === 'variables'  && <VariablesModal  call={modal.call} onClose={() => setModal(null)} />}
    </div>
  )
}
