import React, { useEffect, useRef, useState } from 'react'
import {
  X, Loader2, Clock, Mic, Bot, Volume2, Wrench, Phone, PhoneOff,
  User, MessageSquare, Activity, ChevronDown, ChevronUp, Info,
  CheckCircle2, XCircle, AlertCircle, Play, Pause
} from 'lucide-react'
import { useTranscript } from '../hooks/useTranscript'
import { useRecording } from '../hooks/useRecording'
import { useTrace } from '../hooks/useTrace'
import { Interaction } from '../types'
import { generateCallSummary } from '../utils/summaryUtils'
import { CallSummary } from './CallSummary'

type Tab = 'overview' | 'transcript' | 'log-analyser'

interface Props {
  interaction: Interaction | null
  onClose: () => void
  initialTab?: Tab
}

function relativeTime(base: string, ts: string): string {
  try {
    const diffMs = new Date(ts).getTime() - new Date(base).getTime()
    if (diffMs < 0) return '+0.0s'
    const secs = diffMs / 1000
    if (secs < 60) return `+${secs.toFixed(1)}s`
    return `+${Math.floor(secs / 60)}m ${(secs % 60).toFixed(0)}s`
  } catch {
    return ts
  }
}

function formatTs(ts: string): string {
  try { return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
  catch { return ts }
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    connected:    { cls: 'bg-green-100 text-green-700 border-green-200',   icon: <CheckCircle2 size={11} /> },
    disconnected: { cls: 'bg-gray-100 text-gray-600 border-gray-200',      icon: <XCircle size={11} /> },
    failed:       { cls: 'bg-red-100 text-red-600 border-red-200',         icon: <XCircle size={11} /> },
    success:      { cls: 'bg-green-100 text-green-700 border-green-200',   icon: <CheckCircle2 size={11} /> },
    incomplete:   { cls: 'bg-yellow-100 text-yellow-700 border-yellow-200',icon: <AlertCircle size={11} /> },
  }
  const style = map[status?.toLowerCase()] ?? { cls: 'bg-gray-100 text-gray-600 border-gray-200', icon: null }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${style.cls}`}>
      {style.icon}{status}
    </span>
  )
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.06] last:border-0">
      <span className="text-xs text-[#475569]">{label}</span>
      <span className="text-xs font-medium text-[#f1f5f9]">{value ?? '—'}</span>
    </div>
  )
}

// ── Recording player ──────────────────────────────────────────────────────────
function RecordingPlayer({ interactionId }: { interactionId: string }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Always enabled — load immediately when the component mounts
  const { data: recordingUrl, isLoading, error } = useRecording(interactionId, true)

  const toggle = () => {
    if (!audioRef.current) return
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false) }
    else           { audioRef.current.play().catch(() => {}); setIsPlaying(true) }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-3 px-4 bg-[#222538] border border-white/[0.06] rounded-xl">
        <Loader2 className="animate-spin text-green-400 flex-shrink-0" size={16} />
        <div>
          <p className="text-xs font-semibold text-[#f1f5f9]">Loading recording…</p>
          <p className="text-[10px] text-[#475569] mt-0.5">Fetching audio from Sarvam</p>
        </div>
      </div>
    )
  }

  if (error || !recordingUrl) {
    const msg = error instanceof Error ? error.message : 'No recording available'
    const isNoRecording = msg === 'NO_RECORDING' || msg.includes('404') || msg.includes('No recording')
    return (
      <div className="flex items-center gap-3 py-3 px-4 bg-[#222538] border border-white/[0.06] rounded-xl">
        <Volume2 size={15} className={isNoRecording ? 'text-[#475569]' : 'text-red-400'} />
        <div>
          <p className={`text-xs font-medium ${isNoRecording ? 'text-[#475569]' : 'text-red-400'}`}>
            {isNoRecording ? 'No recording for this call' : 'Failed to load recording'}
          </p>
          {!isNoRecording && (
            <p className="text-[10px] text-red-400 mt-0.5">{msg}</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#222538] border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm transition-colors"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#f1f5f9]">Call Recording</p>
          <p className="text-[10px] text-[#475569] mt-0.5">Dual-channel WAV · User (left ch.) · Agent (right ch.)</p>
        </div>
        <Volume2 size={14} className="text-[#475569] flex-shrink-0" />
      </div>
      {/* Full native audio controls */}
      <div className="px-4 pb-3">
        <audio
          ref={audioRef}
          controls
          src={recordingUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          className="w-full"
          style={{ accentColor: '#4CAF50' }}
        />
      </div>
    </div>
  )
}

// ── Transcript messages ───────────────────────────────────────────────────────
function TranscriptView({ messages }: { messages: Array<{ role: string; content: string }> }) {
  if (messages.length === 0) {
    return <p className="text-[#475569] text-sm text-center py-6">No transcript available</p>
  }
  return (
    <div className="space-y-3">
      {messages.map((msg, i) => {
        const isUser = msg.role === 'user'
        return (
          <div key={i} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
              isUser ? 'bg-blue-900' : 'bg-green-900'
            }`}>
              {isUser
                ? <User size={13} className="text-blue-400" />
                : <Bot size={13} className="text-green-400" />
              }
            </div>
            {/* Bubble */}
            <div className={`flex flex-col gap-0.5 ${isUser ? 'items-end' : 'items-start'}`}>
              <span className="text-[#475569] text-[10px] px-1 capitalize">{msg.role}</span>
              <div className={
                isUser
                  ? 'bg-blue-600 text-white rounded-xl px-3 py-2 text-sm max-w-[75%] ml-auto'
                  : 'bg-[#222538] text-[#f1f5f9] border border-white/[0.06] rounded-xl px-3 py-2 text-sm max-w-[75%]'
              }>
                {msg.content}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Log Analyser ──────────────────────────────────────────────────────────────
function LogAnalyser({ trace, callStart, agentVars }: {
  trace: NonNullable<ReturnType<typeof useTrace>['data']>
  callStart: string
  agentVars: Record<string, unknown> | null | undefined
}) {
  const [openTurns, setOpenTurns] = useState<Set<number>>(new Set([0]))

  const toggle = (id: number) => {
    setOpenTurns(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  return (
    <div className="space-y-5">
      {/* Config at start — Conversation Initiated */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#222538] border-b border-white/[0.06]">
          <Phone size={13} className="text-green-400" />
          <span className="text-xs font-semibold text-[#f1f5f9] uppercase tracking-wide">Conversation Initiated</span>
        </div>
        <div className="px-4 py-3 space-y-0">
          {trace.lifecycle_events?.filter(e =>
            e.event?.toLowerCase().includes('start') || e.event?.toLowerCase().includes('init') || e.event?.toLowerCase().includes('begin')
          ).slice(0, 1).map((ev, i) => (
            <div key={i}>
              {ev.data && Object.entries(ev.data).map(([k, v]) => (
                <MetaRow key={k} label={k} value={String(v)} />
              ))}
            </div>
          ))}
          {trace.lifecycle_events?.length > 0 && (
            <MetaRow label="Call Start" value={formatTs(callStart)} />
          )}
        </div>
      </div>

      {/* Per-turn breakdown */}
      {trace.turns?.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-[#475569] uppercase tracking-widest px-1">Turns</h4>
          {trace.turns.map((turn, idx) => {
            const isOpen = openTurns.has(idx)
            return (
              <div key={idx} className="rounded-xl border border-white/[0.06] overflow-hidden shadow-sm">
                {/* Turn header — clickable */}
                <button
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-[#222538] hover:bg-[#2a2d42] transition-colors text-left"
                  onClick={() => toggle(idx)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-[#f1f5f9]">Turn {idx + 1}</span>
                    {turn.user_text && (
                      <span className="text-xs text-[#475569] truncate max-w-[180px]">"{turn.user_text}"</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Latency badges */}
                    <div className="flex gap-2">
                      {turn.asr_latency_ms != null && (
                        <span className="flex items-center gap-1 text-[10px] text-[#475569] bg-[#1a1d2e] border border-white/[0.06] rounded-full px-2 py-0.5">
                          <Mic size={9} className="text-blue-400" /> {turn.asr_latency_ms}ms
                        </span>
                      )}
                      {turn.llm_latency_ms != null && (
                        <span className="flex items-center gap-1 text-[10px] text-[#475569] bg-[#1a1d2e] border border-white/[0.06] rounded-full px-2 py-0.5">
                          <Bot size={9} className="text-purple-400" /> {turn.llm_latency_ms}ms
                        </span>
                      )}
                      {turn.tts_latency_ms != null && (
                        <span className="flex items-center gap-1 text-[10px] text-[#475569] bg-[#1a1d2e] border border-white/[0.06] rounded-full px-2 py-0.5">
                          <Volume2 size={9} className="text-green-400" /> {turn.tts_latency_ms}ms
                        </span>
                      )}
                    </div>
                    {isOpen ? <ChevronUp size={14} className="text-[#475569]" /> : <ChevronDown size={14} className="text-[#475569]" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 py-3 space-y-3 bg-[#1a1d2e]">
                    {/* User transcript */}
                    {turn.user_text && (
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User size={10} className="text-blue-400" />
                        </div>
                        <div>
                          <p className="text-[10px] text-blue-400 font-semibold mb-0.5">User (ASR)</p>
                          <p className="text-xs text-[#94a3b8] leading-relaxed">{turn.user_text}</p>
                        </div>
                      </div>
                    )}
                    {/* Agent response */}
                    {turn.assistant_text && (
                      <div className="flex gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Bot size={10} className="text-green-400" />
                        </div>
                        <div>
                          <p className="text-[10px] text-green-400 font-semibold mb-0.5">Agent (LLM → TTS)</p>
                          <p className="text-xs text-[#94a3b8] leading-relaxed">{turn.assistant_text}</p>
                        </div>
                      </div>
                    )}
                    {/* Tool calls */}
                    {turn.events && turn.events.length > 0 && (
                      <div className="space-y-1.5 pt-1 border-t border-white/[0.06]">
                        <p className="text-[10px] text-orange-400 font-semibold uppercase tracking-wide">Tool Calls</p>
                        {turn.events.map((ev, ei) => (
                          <div key={ei} className="flex items-start gap-2 bg-[#222538] border border-white/[0.06] rounded-lg px-3 py-2">
                            <Wrench size={11} className="text-orange-400 mt-0.5 flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="text-[10px] font-mono font-semibold text-orange-400">{ev.event}</span>
                              {ev.data && (
                                <p className="text-[10px] text-[#475569] mt-0.5 break-all">
                                  {JSON.stringify(ev.data).slice(0, 120)}
                                  {JSON.stringify(ev.data).length > 120 ? '…' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Conversation Ended */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#222538] border-b border-white/[0.06]">
          <PhoneOff size={13} className="text-red-400" />
          <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">Conversation Ended</span>
        </div>
        <div className="px-4 py-3">
          {trace.lifecycle_events?.filter(e =>
            e.event?.toLowerCase().includes('end') || e.event?.toLowerCase().includes('close') ||
            e.event?.toLowerCase().includes('complete') || e.event?.toLowerCase().includes('analysis')
          ).slice(-1).map((ev, i) => (
            <div key={i}>
              {ev.data && Object.entries(ev.data).map(([k, v]) => (
                <MetaRow key={k} label={k} value={typeof v === 'object' ? JSON.stringify(v) : String(v)} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Agent Variables at end of call */}
      {agentVars && Object.keys(agentVars).length > 0 && (
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[#222538] border-b border-white/[0.06]">
            <Wrench size={13} className="text-purple-400" />
            <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">End State Variables</span>
          </div>
          <div className="px-4 py-3 space-y-0">
            {Object.entries(agentVars).map(([key, val]) => (
              <MetaRow key={key} label={key} value={
                <span className="font-mono text-[11px] text-purple-400 bg-[#222538] px-1.5 py-0.5 rounded border border-white/[0.06]">
                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                </span>
              } />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Panel ────────────────────────────────────────────────────────────────
export function TranscriptPanel({ interaction, onClose, initialTab }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab ?? 'transcript')
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: transcript, isLoading: tLoading, error: tError } = useTranscript(
    interaction?.interaction_id ?? null
  )
  const { data: trace, isLoading: trLoading } = useTrace(
    interaction?.interaction_id ?? null,
    tab === 'log-analyser'
  )

  useEffect(() => {
    if (initialTab) setTab(initialTab)
  }, [initialTab, interaction?.interaction_id])

  useEffect(() => {
    if (tab === 'transcript') {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [transcript, tab])

  if (!interaction) return null

  const messages = transcript?.messages ?? interaction.original_transcript ?? []

  // If no Sarvam transcript, try to use webhook transcript stored in agent_variables
  const webhookTranscript = (interaction.agent_variables as Record<string, unknown>)?.interaction_transcript as Array<{role:string; en_text:string}> | undefined
  const displayMessages = messages.length > 0
    ? messages
    : webhookTranscript
      ? webhookTranscript.map(t => ({ role: t.role === 'agent' ? 'assistant' : t.role, content: t.en_text ?? '' }))
      : []
  const summary = displayMessages.length > 0
    ? generateCallSummary(displayMessages, {
        goal_overall_status: interaction.goal_overall_status,
        duration_in_seconds: interaction.duration_in_seconds,
        language_name: interaction.language_name,
        ended_by: interaction.ended_by,
        agent_variables: interaction.agent_variables,
      })
    : null

  const callStart = interaction.started_at ?? interaction.created_at ?? ''

  const postCallData = trace?.lifecycle_events?.find(e =>
    e.event?.toLowerCase().includes('post_call') || e.event?.toLowerCase().includes('analysis')
  )?.data
  const agentVars = postCallData ?? interaction.agent_variables

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',      label: 'Overview',      icon: <Info size={13} /> },
    { id: 'transcript',    label: 'Transcript',     icon: <MessageSquare size={13} /> },
    { id: 'log-analyser',  label: 'Log Analyser',   icon: <Activity size={13} /> },
  ]

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[680px] bg-[#1a1d2e] border-l border-white/[0.06] z-50 flex flex-col shadow-2xl">

        {/* ── Header ── */}
        <div className="border-b border-white/[0.06] px-5 py-4 flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-green-900 flex items-center justify-center flex-shrink-0">
              <Phone size={15} className="text-green-400" />
            </div>
            <div>
              <p className="text-[#f1f5f9] font-semibold text-sm">Call Details</p>
              <p className="text-[11px] font-mono text-[#475569] mt-0.5 select-all">{interaction.interaction_id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#475569] hover:text-[#f1f5f9] mt-0.5 transition-colors">
            <X size={17} />
          </button>
        </div>

        {/* ── Quick meta strip ── */}
        <div className="flex items-center gap-4 px-5 py-2.5 bg-[#222538] border-b border-white/[0.06] flex-wrap">
          {interaction.user_contact_masked && (
            <span className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
              <User size={11} className="text-[#475569]" />
              {interaction.user_contact_masked}
            </span>
          )}
          {interaction.duration_in_seconds != null && (
            <span className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
              <Clock size={11} className="text-[#475569]" />
              {Math.floor(interaction.duration_in_seconds / 60)}m {interaction.duration_in_seconds % 60}s
            </span>
          )}
          {interaction.language_name && (
            <span className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
              <MessageSquare size={11} className="text-[#475569]" />
              {interaction.language_name}
            </span>
          )}
          {interaction.connectivity_status && (
            <StatusBadge status={interaction.connectivity_status} />
          )}
          {interaction.goal_overall_status && (
            <StatusBadge status={interaction.goal_overall_status} />
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-white/[0.06] px-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 transition-colors ${
                tab === t.id
                  ? 'text-green-400 text-[13px] px-4 py-2.5 border-b-2 border-green-500'
                  : 'text-[#475569] text-[13px] px-4 py-2.5 border-b-2 border-transparent hover:text-[#94a3b8]'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto">

          {/* OVERVIEW TAB */}
          {tab === 'overview' && (
            <div className="p-5 space-y-4">
              {summary && <CallSummary summary={summary} />}

              {/* Call metadata card */}
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#222538] border-b border-white/[0.06]">
                  <Info size={13} className="text-[#475569]" />
                  <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide">Call Metadata</span>
                </div>
                <div className="px-4 py-3 space-y-0">
                  <MetaRow label="Interaction ID"    value={<span className="font-mono text-[10px]">{interaction.interaction_id}</span>} />
                  <MetaRow label="Direction"         value={<span className="capitalize">{interaction.channel_direction}</span>} />
                  <MetaRow label="Channel"           value={interaction.channel_type} />
                  <MetaRow label="Language"          value={interaction.language_name} />
                  <MetaRow label="Duration"          value={interaction.duration_in_seconds != null ? `${interaction.duration_in_seconds}s` : null} />
                  <MetaRow label="Turns"             value={interaction.num_messages} />
                  <MetaRow label="End Reason"        value={<span className="capitalize">{interaction.end_reason}</span>} />
                  <MetaRow label="Ended By"          value={<span className="capitalize">{interaction.ended_by}</span>} />
                  <MetaRow label="Connectivity"      value={interaction.connectivity_status ? <StatusBadge status={interaction.connectivity_status} /> : null} />
                  <MetaRow label="Goal Status"       value={interaction.goal_overall_status ? <StatusBadge status={interaction.goal_overall_status} /> : null} />
                  {callStart && <MetaRow label="Started At" value={formatTs(callStart)} />}
                </div>
              </div>

              {/* Recording player */}
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-[#222538] border-b border-white/[0.06]">
                  <Volume2 size={13} className="text-[#475569]" />
                  <span className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide">Recording</span>
                </div>
                <div className="p-4">
                  <RecordingPlayer interactionId={interaction.interaction_id} />
                </div>
              </div>
            </div>
          )}

          {/* TRANSCRIPT TAB — matches Sarvam: transcript + recording player at bottom */}
          {tab === 'transcript' && (
            <div className="flex flex-col h-full">
              <div className="flex-1 p-5">
                {tLoading && (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="animate-spin text-green-400" size={24} />
                    <p className="text-[#475569] text-sm">Loading transcript…</p>
                  </div>
                )}
                {tError && (
                  <div className="flex items-center gap-2 bg-[#222538] border border-white/[0.06] rounded-xl px-4 py-3">
                    <XCircle size={15} className="text-red-400" />
                    <p className="text-red-400 text-sm">Failed to load transcript</p>
                  </div>
                )}
                {!tLoading && !tError && (
                  <TranscriptView messages={displayMessages} />
                )}
                <div ref={bottomRef} />
              </div>

              {/* ── Recording player pinned at bottom of transcript (exactly like Sarvam) ── */}
              <div className="border-t border-white/[0.06] p-4 bg-[#1a1d2e] flex-shrink-0">
                <RecordingPlayer interactionId={interaction.interaction_id} />
              </div>
            </div>
          )}

          {/* LOG ANALYSER TAB */}
          {tab === 'log-analyser' && (
            <div className="p-5">
              {trLoading && (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="animate-spin text-green-400" size={24} />
                  <p className="text-[#475569] text-sm">Loading trace…</p>
                </div>
              )}
              {!trLoading && !trace && (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                  <Activity size={32} className="text-[#475569]" />
                  <p className="text-[#475569] text-sm">No trace data available</p>
                  <p className="text-[10px] text-[#475569]">Trace is only available for recent calls</p>
                </div>
              )}
              {trace && (
                <LogAnalyser trace={trace} callStart={callStart} agentVars={agentVars as Record<string, unknown>} />
              )}
            </div>
          )}

        </div>
      </div>
    </>
  )
}
