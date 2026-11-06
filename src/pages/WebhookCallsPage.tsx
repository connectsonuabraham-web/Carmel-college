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
  if (!d) return <span className="text-\[#7b857f\] text-xs">—</span>
  const map: Record<string, string> = {
    interested:          'bg-\[#d8f58f\]/60 text-\[#1f6b47\]',
    not_interested:      'bg-red-50   text-\[#d9534f\]',
    callback:            'bg-orange-50 text-\[#f0883e\]',
    busy_callback:       'bg-orange-50 text-\[#f0883e\]',
    wrong_number:        'bg-\[#f5f6f4\] text-\[#7b857f\]',
    enrolled:            'bg-\[#a6e22e\]/20 text-\[#1f6b47\]',
    transferred:         'bg-blue-500/10  text-blue-400',
    no_answer:           'bg-\[#f5f6f4\] text-\[#7b857f\]',
  }
  const cls = map[d.toLowerCase()] ?? 'bg-\[#f5f6f4\] text-\[#7b857f\]'
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize whitespace-nowrap ${cls}`}>{d.replace(/_/g,' ')}</span>
}

// ── Recording player modal ────────────────────────────────────────────────────
function RecordingModal({ call, onClose }: { call: WebhookCall; onClose: () => void }) {
  const [blobUrl,   setBlobUrl]   = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    setLoading(true); setError(null); setBlobUrl(null)

    async function load() {
      // Strategy 1: use recording_url from webhook payload directly
      if (call.recording_url) {
        try {
          const res = await fetch(call.recording_url)
          if (res.ok) {
            const ct  = res.headers.get('content-type') || 'audio/wav'
            const buf = await res.arrayBuffer()
            setBlobUrl(URL.createObjectURL(new Blob([buf], { type: ct })))
            return
          }
        } catch (_) {}
        // If direct URL failed, fall through to analytics API
      }

      // Strategy 2: fetch via /api/recording?id= (server proxy to Sarvam analytics)
      if (!call.interaction_id) { setError('NO_RECORDING'); return }
      try {
        const res = await fetch(`/api/recording?id=${encodeURIComponent(call.interaction_id)}`)
        if (res.status === 404) { setError('NO_RECORDING'); return }
        if (!res.ok) {
          let detail = `HTTP_${res.status}`
          try { const j = await res.json(); detail = j.error || j.detail || detail } catch (_) {}
          setError(detail); return
        }
        const ct  = res.headers.get('content-type') || 'audio/wav'
        const buf = await res.arrayBuffer()
        setBlobUrl(URL.createObjectURL(new Blob([buf], { type: ct })))
      } catch (e) {
        setError('NO_RECORDING')
      }
    }

    load().finally(() => setLoading(false))
  }, [call.interaction_id, call.recording_url])

  const toggle = () => {
    if (!audioRef.current) return
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false) }
    else           { audioRef.current.play().catch(() => {}); setIsPlaying(true) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-\[16px\] border border-\[#e8ebe8\] w-full max-w-lg p-6 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-\[#0f1a14\] text-sm">Call Recording</p>
            <p className="text-xs text-\[#7b857f\] font-mono mt-0.5">{call.interaction_id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-\[#7b857f\]">
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-4 text-xs text-\[#7b857f\] mb-4 flex-wrap">
          {call.user_phone_number && <span className="flex items-center gap-1"><User  size={11} />{call.user_phone_number}</span>}
          {call.duration != null  && <span className="flex items-center gap-1"><Clock size={11} />{fmtDur(call.duration)}</span>}
          {call.start_datetime    && <span className="flex items-center gap-1"><Phone size={11} />{fmt(call.start_datetime)}</span>}
        </div>

        {loading && (
          <div className="flex items-center gap-3 bg-\[#d8f58f\]/60 rounded-\[16px\] px-4 py-4 border border-green-500/20">
            <Loader2 className="animate-spin text-green-500" size={18} />
            <p className="text-xs text-\[#1f6b47\]">Fetching recording from Sarvam…</p>
          </div>
        )}

        {!loading && error === 'NO_RECORDING' && (
          <div className="bg-\[#f5f6f4\] rounded-\[16px\] border border-\[#e8ebe8\] px-4 py-6 text-center">
            <Volume2 size={24} className="text-\[#7b857f\] mx-auto mb-2" />
            <p className="text-sm text-\[#7b857f\] font-medium">No recording for this call</p>
            <p className="text-xs text-\[#7b857f\] mt-1">The call may not have been recorded.</p>
          </div>
        )}

        {!loading && error && error !== 'NO_RECORDING' && (
          <div className="bg-red-50 rounded-\[16px\] border border-red-500/20 px-4 py-4">
            <p className="text-xs text-\[#d9534f\] font-medium">Failed to load recording</p>
            <p className="text-xs text-\[#d9534f\] mt-1 opacity-70">{error}</p>
          </div>
        )}

        {!loading && blobUrl && (
          <div className="bg-\[#d8f58f\]/60 rounded-\[16px\] border border-green-500/20 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={toggle}
                className="w-9 h-9 rounded-full bg-\[#1f6b47\] hover:bg-green-700 flex items-center justify-center text-white flex-shrink-0 transition-colors"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
              </button>
              <div className="flex-1">
                <p className="text-xs font-semibold text-\[#1f6b47\]">Call Recording</p>
                <p className="text-[10px] text-\[#1f6b47\] mt-0.5 opacity-70">Dual-channel WAV · User (left) · Agent (right)</p>
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
                className="inline-flex items-center gap-1.5 text-xs text-\[#1f6b47\] hover:text-green-300 font-medium">
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-\[16px\] border border-\[#e8ebe8\] w-full max-w-2xl max-h-[85vh] flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-\[#e8ebe8\] flex-shrink-0">
          <div>
            <p className="font-semibold text-\[#0f1a14\] text-sm">Transcript</p>
            <p className="text-xs text-\[#7b857f\] font-mono mt-0.5">{call.interaction_id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-\[#7b857f\]"><X size={16} /></button>
        </div>

        {/* Summary bar */}
        {(call.call_summary || call.call_disposition) && (
          <div className="px-5 py-3 bg-\[#d8f58f\]/60 border-b border-green-500/20 flex-shrink-0 space-y-1">
            {call.call_disposition && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-\[#1f6b47\] font-medium w-24 flex-shrink-0">Disposition</span>
                <DispositionBadge d={call.call_disposition} />
              </div>
            )}
            {call.call_summary && (
              <div className="flex items-start gap-2">
                <span className="text-xs text-\[#1f6b47\] font-medium w-24 flex-shrink-0">Summary</span>
                <p className="text-xs text-\[#1f6b47\] opacity-90">{call.call_summary}</p>
              </div>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {!turns || turns.length === 0 ? (
            <p className="text-sm text-\[#7b857f\] text-center py-8">No transcript available for this call</p>
          ) : (
            turns.map((turn: WebhookTranscriptTurn, i: number) => {
              const isUser = turn.role === 'user'
              return (
                <div key={i} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isUser ? 'bg-blue-500/10' : 'bg-\[#d8f58f\]/60'}`}>
                    {isUser ? <User size={13} className="text-blue-400" /> : <Bot size={13} className="text-\[#1f6b47\]" />}
                  </div>
                  <div className={`max-w-[78%] flex flex-col gap-0.5 ${isUser ? 'items-end' : ''}`}>
                    <span className="text-[10px] text-\[#7b857f\] px-1 capitalize">{turn.role}</span>
                    <div className={`rounded-\[16px\] px-3.5 py-2.5 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-sm'
                        : 'bg-\[#f5f6f4\] border border-\[#e8ebe8\] text-\[#7b857f\] rounded-tl-sm'
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-\[16px\] border border-\[#e8ebe8\] w-full max-w-lg max-h-[80vh] flex flex-col z-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-\[#e8ebe8\] flex-shrink-0">
          <div>
            <p className="font-semibold text-\[#0f1a14\] text-sm">Agent Variables</p>
            <p className="text-xs text-\[#7b857f\] font-mono mt-0.5">{call.interaction_id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-\[#7b857f\]"><X size={16} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {!hasVars ? (
            <p className="text-sm text-\[#7b857f\] text-center py-6">No agent variables for this call</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(vars).map(([k, v]) => (
                <div key={k} className="flex items-start gap-3 py-2 border-b border-white/[0.05] last:border-0">
                  <span className="text-xs font-mono text-\[#1f6b47\] min-w-[160px] font-medium mt-0.5">{k}</span>
                  <span className={`text-xs break-all flex-1 ${
                    v === null || v === undefined ? 'text-\[#7b857f\] italic' : 'text-\[#7b857f\]'
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

  const inputCls = 'rounded-lg border border-\[#e8ebe8\] bg-white px-3 py-2 text-sm text-\[#7b857f\] placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-\[#a6e22e\] focus:border-\[#1f6b47\]'

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-wrap gap-4 items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-\[#0f1a14\]">Live Call Log</h1>
          <p className="text-sm text-\[#7b857f\] mt-0.5">
            {total > 0 ? `${total} calls received via webhook` : 'Calls received via Sarvam webhook in real time'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFetching && <span className="text-xs text-\[#1f6b47\] animate-pulse">Refreshing…</span>}
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['webhook-calls'] })}
            className="flex items-center gap-1.5 bg-\[#1f6b47\] hover:bg-green-700 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
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
        <div className="flex items-center gap-3 bg-red-50 border border-red-500/20 rounded-\[16px\] px-4 py-3">
          <AlertCircle size={15} className="text-\[#d9534f\] flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-\[#d9534f\]">Could not reach the webhook server</p>
            <p className="text-xs text-\[#d9534f\] mt-0.5 opacity-70">Make sure <code className="bg-red-50 px-1 rounded">node webhook-server/server.js</code> is running on your Hostinger server.</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-\[16px\] border border-\[#e8ebe8\] bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-\[#f5f6f4\] border-b border-\[#e8ebe8\]">
              {['Date/Time','Caller','Duration','Disposition','Summary','Caller Name','Course','Transfer?','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-\[#7b857f\] uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-\[#e8ebe8\]">
            {isFetching && calls.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center">
                <Loader2 className="animate-spin text-\[#1f6b47\] mx-auto" size={22} />
              </td></tr>
            ) : calls.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-\[#7b857f\] text-sm">
                No calls yet. Calls will appear here as soon as the webhook receives them.
              </td></tr>
            ) : (
              calls.map(call => (
                <tr key={call.interaction_id} className="hover:bg-\[#f5f6f4\] transition-colors">
                  {/* Date/Time */}
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-\[#7b857f\]">
                    {fmt(call.start_datetime ?? call.received_at)}
                  </td>

                  {/* Caller */}
                  <td className="px-4 py-3 font-mono text-xs text-\[#7b857f\] whitespace-nowrap">
                    {call.user_phone_number ?? '—'}
                  </td>

                  {/* Duration */}
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-\[#7b857f\]">
                    {fmtDur(call.duration)}
                  </td>

                  {/* Disposition */}
                  <td className="px-4 py-3">
                    <DispositionBadge d={call.call_disposition} />
                  </td>

                  {/* Summary */}
                  <td className="px-4 py-3 max-w-[220px]">
                    {call.call_summary
                      ? <p className="text-xs text-\[#7b857f\] truncate" title={call.call_summary}>{call.call_summary}</p>
                      : <span className="text-\[#7b857f\] text-xs">—</span>
                    }
                  </td>

                  {/* Caller Name */}
                  <td className="px-4 py-3 text-xs text-\[#7b857f\] whitespace-nowrap">
                    {call.caller_name ?? '—'}
                  </td>

                  {/* Course */}
                  <td className="px-4 py-3 text-xs text-\[#7b857f\] whitespace-nowrap max-w-[120px] truncate">
                    {call.course_interested_in ?? '—'}
                  </td>

                  {/* Human transfer */}
                  <td className="px-4 py-3 text-center">
                    {call.human_transfer_needed === true  || call.human_transfer_needed === 'true'
                      ? <span title="Transfer needed"><CheckCircle2 size={14} className="text-\[#f0883e\] mx-auto" /></span>
                      : call.human_transfer_needed === false || call.human_transfer_needed === 'false'
                        ? <XCircle size={14} className="text-\[#7b857f\] mx-auto" />
                        : <span className="text-\[#7b857f\] text-xs">—</span>
                    }
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* Play recording */}
                      <button
                        onClick={() => setModal({ type: 'recording', call })}
                        title="Play recording"
                        className="p-1.5 rounded-lg transition-colors text-green-500 hover:bg-\[#d8f58f\]/60"
                      >
                        <Play size={14} />
                      </button>

                      {/* Transcript */}
                      <button
                        onClick={() => setModal({ type: 'transcript', call })}
                        title="View transcript"
                        className="p-1.5 rounded-lg text-green-500 hover:bg-\[#d8f58f\]/60 transition-colors"
                      >
                        <MessageSquare size={14} />
                      </button>

                      {/* Agent variables */}
                      <button
                        onClick={() => setModal({ type: 'variables', call })}
                        title="Agent variables"
                        className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-500/10 transition-colors"
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
          <p className="text-sm text-\[#7b857f\]">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-lg border border-\[#e8ebe8\] disabled:opacity-40 hover:bg-\[#f5f6f4\] transition-colors">
              <ChevronLeft size={16} className="text-\[#7b857f\]" />
            </button>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-lg border border-\[#e8ebe8\] disabled:opacity-40 hover:bg-\[#f5f6f4\] transition-colors">
              <ChevronRight size={16} className="text-\[#7b857f\]" />
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
