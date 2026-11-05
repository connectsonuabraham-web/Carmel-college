import React, { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Phone, Tag, MoreVertical, User, Bot, CheckCircle2, DollarSign, StickyNote, X } from 'lucide-react'
import { useConversations, useAiOffLeads } from '../hooks/useSetSmart'
import { setBooked, setSold, addNotes } from '../api/setsmart'
import type { Conversation, Message } from '../api/setsmart'

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
}

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ts
  }
}

function formatRelative(ts: string): string {
  try {
    const d = new Date(ts)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

type FilterTab = 'all' | 'answered' | 'booked'

export function WhatsAppConversationsPage() {
  const queryClient = useQueryClient()
  const { data: convsResp, isFetching } = useConversations()
  const { data: aiOff = [] } = useAiOffLeads()

  const conversations = convsResp?.conversations ?? []

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterTab>('all')
  const [noteText, setNoteText] = useState('')
  const [showNoteBox, setShowNoteBox] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)

  const aiOffPhones = useMemo(() => new Set(aiOff.map(l => l.number)), [aiOff])

  const filtered = useMemo(() => {
    return [...conversations]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .filter(c => {
        const nameMatch = c.contact.name.toLowerCase().includes(search.toLowerCase())
        const phoneMatch = c.contact.phone.includes(search)
        if (!nameMatch && !phoneMatch) return false
        if (filter === 'answered') return c.qualification.answered === true
        if (filter === 'booked') return c.qualification.booked === true
        return true
      })
  }, [conversations, search, filter])

  const selected: Conversation | null = selectedId != null
    ? (conversations.find(c => c.id === selectedId) ?? null)
    : (filtered[0] ?? null)

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const bookedMutation = useMutation({
    mutationFn: (id: number) => setBooked(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ss-convs'] })
      showToast('Marked as booked', true)
    },
    onError: () => showToast('Failed to mark booked', false),
  })

  const soldMutation = useMutation({
    mutationFn: (id: number) => setSold(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ss-convs'] })
      showToast('Marked as sold', true)
    },
    onError: () => showToast('Failed to mark sold', false),
  })

  const notesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: number; notes: string }) => addNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ss-convs'] })
      setNoteText('')
      setShowNoteBox(false)
      showToast('Note added', true)
    },
    onError: () => showToast('Failed to add note', false),
  })

  const answeredCount = conversations.filter(c => c.qualification.answered).length
  const bookedCount = conversations.filter(c => c.qualification.booked).length

  return (
    <div className="flex h-[calc(100vh-120px)] gap-0 bg-[#1a1d2e] rounded-xl border border-white/[0.06] overflow-hidden relative">
      {/* Toast */}
      {toast && (
        <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm font-medium shadow-lg ${toast.ok ? 'bg-green-600 text-white' : 'bg-red-500 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Left: Conversation list */}
      <div className="w-72 flex-shrink-0 border-r border-white/[0.06] flex flex-col">
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-[#f1f5f9]">Conversations</p>
            {isFetching && <span className="text-[10px] text-green-500 animate-pulse">Refreshing…</span>}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search contacts…"
              className="w-full pl-8 pr-3 py-2 text-xs border border-white/[0.08] bg-[#222538] rounded-lg text-[#94a3b8] placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
          <div className="flex gap-1 mt-2">
            {([
              { id: 'all', label: `All ${conversations.length}` },
              { id: 'answered', label: `Answered ${answeredCount}` },
              { id: 'booked', label: `Booked ${bookedCount}` },
            ] as { id: FilterTab; label: string }[]).map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`flex-1 text-[10px] font-medium py-1 rounded-lg transition-colors ${filter === f.id ? 'bg-green-600 text-white' : 'text-[#475569] hover:bg-white/[0.03]'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-xs text-[#475569] text-center py-8">No conversations</p>
          ) : filtered.map((conv: Conversation) => {
            const lastMsg = conv.messages[conv.messages.length - 1]
            const isAiOff = aiOffPhones.has(conv.contact.phone)
            return (
              <div key={conv.id} onClick={() => setSelectedId(conv.id)}
                className={`p-3 border-b border-white/[0.05] cursor-pointer hover:bg-green-500/[0.06] transition-colors ${selected?.id === conv.id ? 'bg-green-500/[0.06]' : ''}`}>
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-400 text-xs font-bold">{getInitials(conv.contact.name)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-[#f1f5f9] truncate">{conv.contact.name}</p>
                      <p className="text-[10px] text-[#475569] flex-shrink-0">{formatRelative(conv.updated_at)}</p>
                    </div>
                    <p className="text-[10px] text-[#475569] truncate mt-0.5">{lastMsg?.content.slice(0, 40) ?? 'No messages'}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-[#475569]">{conv.message_count} msgs</span>
                      {conv.qualification.booked && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-medium">Booked</span>}
                      {isAiOff && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">AI Off</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Middle: Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {selected ? (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center">
                  <span className="text-green-400 text-xs font-bold">{getInitials(selected.contact.name)}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#f1f5f9]">{selected.contact.name}</p>
                  <p className="text-[10px] text-[#475569]">{selected.contact.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selected.qualification.status && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-white/[0.04] text-[#94a3b8]">{selected.qualification.status}</span>
                )}
                <button className="p-1.5 rounded hover:bg-white/[0.06]"><Phone size={14} className="text-[#475569]" /></button>
                <button className="p-1.5 rounded hover:bg-white/[0.06]"><Tag size={14} className="text-[#475569]" /></button>
                <button className="p-1.5 rounded hover:bg-white/[0.06]"><MoreVertical size={14} className="text-[#475569]" /></button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 px-4 py-2 border-b border-white/[0.06] bg-[#222538]">
              <button
                onClick={() => bookedMutation.mutate(selected.id)}
                disabled={selected.qualification.booked || bookedMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
              >
                <CheckCircle2 size={12} /> {bookedMutation.isPending ? 'Marking…' : 'Mark Booked'}
              </button>
              <button
                onClick={() => soldMutation.mutate(selected.id)}
                disabled={soldMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-green-500/20 text-green-400 hover:bg-green-500/10"
              >
                <DollarSign size={12} /> {soldMutation.isPending ? 'Marking…' : 'Mark Sold'}
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#222538]">
              <div className="text-center">
                <span className="text-[10px] text-[#475569] bg-[#1a1d2e] px-3 py-1 rounded-full">{selected.messages.length} messages</span>
              </div>
              {selected.messages.length === 0 ? (
                <p className="text-xs text-[#475569] text-center py-8">No messages in this conversation</p>
              ) : selected.messages.map((msg: Message, i: number) => {
                const isUser = msg.role === 'user'
                return (
                  <div key={i} className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isUser ? 'bg-blue-500/10' : 'bg-green-500/10'}`}>
                      {isUser ? <User size={12} className="text-blue-400" /> : <Bot size={12} className="text-green-400" />}
                    </div>
                    <div className={`max-w-[70%] rounded-xl px-3 py-2 text-xs leading-relaxed ${isUser ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-[#1a1d2e] border border-white/[0.06] text-[#94a3b8] rounded-tl-sm'}`}>
                      {!isUser && msg.sent_by && (
                        <p className="text-[9px] font-semibold text-green-400 mb-1">{msg.sent_by}</p>
                      )}
                      <p className="whitespace-pre-line">{msg.content}</p>
                      <p className={`text-[9px] mt-1 ${isUser ? 'text-blue-200' : 'text-[#475569]'}`}>{formatTime(msg.timestamp)}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Input bar — read-only note */}
            <div className="px-4 py-3 border-t border-white/[0.06] bg-[#1a1d2e]">
              <div className="bg-[#222538] rounded-lg px-4 py-2.5 text-xs text-[#475569] text-center">
                Message sending available in SetSmart dashboard at setsmart.io
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-[#475569]">Select a conversation</p>
          </div>
        )}
      </div>

      {/* Right: Contact details */}
      {selected && (
        <div className="w-64 flex-shrink-0 border-l border-white/[0.06] flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <span className="text-green-400 font-bold text-sm">{getInitials(selected.contact.name)}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#f1f5f9]">{selected.contact.name}</p>
                <p className="text-[10px] text-green-500">WhatsApp</p>
              </div>
            </div>
            <div className="space-y-1 text-xs text-[#475569]">
              <p><span className="text-[#475569]">Phone:</span> {selected.contact.phone || '—'}</p>
              <p><span className="text-[#475569]">Email:</span> {selected.contact.email || '—'}</p>
            </div>
          </div>

          {/* Qualification */}
          <div className="p-4 border-b border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-[#475569] mb-3">Qualification</p>
            <div className="space-y-1.5">
              {([
                { label: 'Qualified', val: selected.qualification.qualified },
                { label: 'OK to Call', val: selected.qualification.ok_call },
                { label: 'Answered', val: selected.qualification.answered },
                { label: 'Booked', val: selected.qualification.booked },
              ] as { label: string; val: boolean | string | null | undefined }[]).map(q => (
                <div key={q.label} className="flex items-center justify-between">
                  <span className="text-xs text-[#94a3b8]">{q.label}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${q.val ? 'bg-green-500/10 text-green-400' : 'bg-white/[0.04] text-[#475569]'}`}>
                    {q.val ? 'Yes' : 'No'}
                  </span>
                </div>
              ))}
              {selected.qualification.status && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#94a3b8]">Status</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-400">{selected.qualification.status}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {selected.tags.length > 0 && (
            <div className="p-4 border-b border-white/[0.06]">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-[#475569] mb-2">Tags</p>
              <div className="flex flex-wrap gap-1">
                {selected.tags.map((tag, i) => (
                  <span key={i} className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* AI Off badge */}
          {aiOffPhones.has(selected.contact.phone) && (
            <div className="px-4 pb-3">
              <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full font-medium">
                AI Off
              </span>
            </div>
          )}

          {/* Notes */}
          <div className="p-4 border-b border-white/[0.06]">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-[#475569] mb-2">Notes</p>
            {selected.notes ? (
              <p className="text-xs text-[#94a3b8] bg-white/[0.04] rounded-lg p-2 mb-3">{selected.notes}</p>
            ) : (
              <p className="text-xs text-[#475569] mb-3">No notes yet</p>
            )}
            {showNoteBox ? (
              <div>
                <textarea
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Add a note…"
                  className="w-full text-xs border border-white/[0.08] bg-[#222538] text-[#94a3b8] placeholder-[#475569] rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-300 resize-none"
                  rows={3}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => notesMutation.mutate({ id: selected.id, notes: noteText })}
                    disabled={!noteText.trim() || notesMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg py-1.5 font-medium disabled:opacity-50"
                  >
                    {notesMutation.isPending ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => { setShowNoteBox(false); setNoteText('') }}
                    className="p-1.5 rounded-lg hover:bg-white/[0.06]"
                  >
                    <X size={14} className="text-[#475569]" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNoteBox(true)}
                className="w-full flex items-center gap-1.5 text-xs text-[#475569] hover:text-green-500 hover:bg-green-500/[0.06] rounded-lg px-2 py-1.5 transition-colors"
              >
                <StickyNote size={12} /> Add Note
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="p-4">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-[#475569] mb-2">Actions</p>
            <div className="space-y-1.5">
              <button className="w-full flex items-center gap-2 text-[11px] text-[#94a3b8] hover:text-green-500 hover:bg-green-500/[0.06] rounded-lg px-2 py-1.5 transition-colors">
                <Bot size={12} className="text-[#475569]" /> Pause AI for this Conversation
              </button>
              <button className="w-full flex items-center gap-2 text-[11px] text-[#94a3b8] hover:text-green-500 hover:bg-green-500/[0.06] rounded-lg px-2 py-1.5 transition-colors">
                <User size={12} className="text-[#475569]" /> Assign to Human
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
