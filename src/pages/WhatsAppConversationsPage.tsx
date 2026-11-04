import React, { useState } from 'react'
import { Search, Phone, Tag, MoreVertical, Send, Paperclip, Smile, User, Bot, CheckCircle2, DollarSign, StickyNote } from 'lucide-react'
import { useSetSmartLeads } from '../hooks/useSetSmart'
import type { SetSmartLead } from '../types/setsmart'

function getInitials(lead: SetSmartLead) {
  const n = lead.name || lead.firstName || lead.phone || '?'
  return n.split(' ').map((x: string) => x[0]).join('').slice(0,2).toUpperCase()
}
function getName(lead: SetSmartLead) {
  if (lead.name) return lead.name
  if (lead.firstName) return `${lead.firstName} ${lead.lastName||''}`.trim()
  return lead.phone || lead.phoneNumber || 'Unknown'
}
function getStatus(lead: SetSmartLead) { return lead.status || lead.leadStatus || 'New' }

const STATUS_COLORS: Record<string,string> = {
  Qualified: 'bg-green-100 text-green-700',
  Booked:    'bg-blue-100 text-blue-700',
  Open:      'bg-gray-100 text-gray-600',
  New:       'bg-yellow-100 text-yellow-700',
  'Not Interested': 'bg-red-100 text-red-600',
}

export function WhatsAppConversationsPage() {
  const { data: leads = [] } = useSetSmartLeads()
  const [selected, setSelected] = useState<SetSmartLead | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all'|'ai'|'human'>('all')
  const [message, setMessage] = useState('')
  const [rightTab, setRightTab] = useState<'contact'|'lead'|'activity'>('contact')

  const filtered = leads.filter((l: SetSmartLead) => {
    const name = getName(l).toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase()) || (l.phone||'').includes(search)
    const matchFilter = filter === 'all' || (filter === 'ai' && l.aiEnabled !== false) || (filter === 'human' && l.aiEnabled === false)
    return matchSearch && matchFilter
  })

  const aiCount    = leads.filter((l: SetSmartLead) => l.aiEnabled !== false).length
  const humanCount = leads.filter((l: SetSmartLead) => l.aiEnabled === false).length

  const currentSelected = selected || (filtered.length > 0 ? filtered[0] : null)

  const mockMessages = currentSelected ? [
    { from: 'user', text: `Hi, I'm interested in the BSc Nursing course at Carmel College.`, time: '10:18 AM' },
    { from: 'agent', text: `Hello ${getName(currentSelected).split(' ')[0]}! 👋\n\nYes, we offer a 4-year BSc Nursing program, approved by INC and KTU.\n\nWould you like me to share the course brochure and fee details?`, time: '10:19 AM' },
    { from: 'user', text: `Can you share the BSc Nursing brochure?`, time: '10:24 AM' },
    { from: 'agent', text: `Here's the BSc Nursing brochure. 📄\n\nIf you'd like, I can also help you book a counselling call with our admissions team.`, time: '10:24 AM' },
  ] : []

  return (
    <div className="flex h-[calc(100vh-120px)] gap-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Left: Conversation list */}
      <div className="w-72 flex-shrink-0 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300" />
          </div>
          <div className="flex gap-1 mt-2">
            {[
              { id:'all', label:`All ${leads.length}` },
              { id:'ai',  label:`AI ${aiCount}` },
              { id:'human', label:`Human ${humanCount}` },
            ].map(f => (
              <button key={f.id} onClick={()=>setFilter(f.id as typeof filter)}
                className={`flex-1 text-[10px] font-medium py-1 rounded-lg transition-colors ${filter===f.id?'bg-green-500 text-white':'text-gray-500 hover:bg-gray-50'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No conversations</p>
          ) : filtered.map((lead: SetSmartLead, i: number) => (
            <div key={i} onClick={()=>setSelected(lead)}
              className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-green-50 transition-colors ${currentSelected?.phone===lead.phone?'bg-green-50':''}`}>
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-700 text-xs font-bold">{getInitials(lead)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-900 truncate">{getName(lead)}</p>
                    <p className="text-[10px] text-gray-400 flex-shrink-0">10:24 AM</p>
                  </div>
                  <p className="text-[10px] text-gray-500 truncate mt-0.5">{lead.lastMessage || 'Start a conversation'}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{lead.aiEnabled!==false?'AI':'Human'}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[getStatus(lead)]||'bg-gray-100 text-gray-500'}`}>{getStatus(lead)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Middle: Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {currentSelected ? (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-green-700 text-xs font-bold">{getInitials(currentSelected)}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{getName(currentSelected)}</p>
                  <p className="text-[10px] text-gray-400">{currentSelected.phone || currentSelected.phoneNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[getStatus(currentSelected)]||'bg-gray-100 text-gray-600'}`}>{getStatus(currentSelected)}</span>
                <button className="p-1.5 rounded hover:bg-gray-100"><Phone size={14} className="text-gray-400" /></button>
                <button className="p-1.5 rounded hover:bg-gray-100"><Tag size={14} className="text-gray-400" /></button>
                <button className="p-1.5 rounded hover:bg-gray-100"><MoreVertical size={14} className="text-gray-400" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              <div className="text-center"><span className="text-[10px] text-gray-400 bg-white px-3 py-1 rounded-full">Today</span></div>
              {mockMessages.map((msg, i) => (
                <div key={i} className={`flex gap-2.5 ${msg.from==='user'?'flex-row-reverse':''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.from==='user'?'bg-blue-100':'bg-green-100'}`}>
                    {msg.from==='user' ? <User size={12} className="text-blue-600"/> : <Bot size={12} className="text-green-600"/>}
                  </div>
                  <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${msg.from==='user'?'bg-blue-600 text-white rounded-tr-sm':'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'}`}>
                    <p className={`text-[9px] font-semibold mb-1 ${msg.from==='user'?'text-blue-200':'text-green-600'}`}>{msg.from==='user'?'Caller':'AI Agent'}</p>
                    <p className="whitespace-pre-line">{msg.text}</p>
                    <p className={`text-[9px] mt-1 ${msg.from==='user'?'text-blue-200':'text-gray-400'}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded-lg hover:bg-gray-100"><Paperclip size={15} className="text-gray-400" /></button>
                <input value={message} onChange={e=>setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 text-sm border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-300" />
                <button className="p-1.5 rounded-lg hover:bg-gray-100"><Smile size={15} className="text-gray-400" /></button>
                <button className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-colors">
                  <Send size={14} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-400">Select a conversation</p>
          </div>
        )}
      </div>

      {/* Right: Contact details */}
      {currentSelected && (
        <div className="w-64 flex-shrink-0 border-l border-gray-100 flex flex-col">
          <div className="flex gap-1 px-3 pt-3 border-b border-gray-100 pb-2">
            {(['contact','lead','activity'] as const).map(t => (
              <button key={t} onClick={()=>setRightTab(t)}
                className={`flex-1 text-[10px] capitalize font-medium py-1.5 rounded-lg transition-colors ${rightTab===t?'bg-green-500 text-white':'text-gray-500 hover:bg-gray-50'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {rightTab === 'contact' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-700 font-bold text-sm">{getInitials(currentSelected)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{getName(currentSelected)}</p>
                    <p className="text-xs text-gray-400">{currentSelected.phone||currentSelected.phoneNumber}</p>
                    <p className="text-[10px] text-green-600">WhatsApp</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">Lead Status</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[getStatus(currentSelected)]||'bg-gray-100 text-gray-600'}`}>{getStatus(currentSelected)}</span>
                </div>
                {currentSelected.tags && currentSelected.tags.length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {currentSelected.tags.map((tag: string,i: number) => <span key={i} className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{tag}</span>)}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">Actions</p>
                  <div className="space-y-1.5">
                    {[
                      { icon: <Bot size={12}/>, label: 'Pause AI for this Conversation' },
                      { icon: <User size={12}/>, label: 'Assign to Human' },
                      { icon: <CheckCircle2 size={12}/>, label: 'Mark as Booked' },
                      { icon: <DollarSign size={12}/>, label: 'Mark as Sold' },
                      { icon: <StickyNote size={12}/>, label: 'Add Note' },
                    ].map((a,i) => (
                      <button key={i} className="w-full flex items-center gap-2 text-[11px] text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg px-2 py-1.5 transition-colors">
                        <span className="text-gray-400">{a.icon}</span>{a.label}
                      </button>
                    ))}
                  </div>
                </div>
                {currentSelected.notes && (
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">Notes</p>
                    <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">{currentSelected.notes}</p>
                  </div>
                )}
              </div>
            )}
            {rightTab === 'lead' && (
              <div className="space-y-3">
                <div><p className="text-[10px] text-gray-400 mb-1">Course Interest</p><p className="text-xs text-gray-900">{currentSelected.course || 'Not specified'}</p></div>
                <div><p className="text-[10px] text-gray-400 mb-1">Phone</p><p className="text-xs text-gray-900">{currentSelected.phone||currentSelected.phoneNumber||'—'}</p></div>
                <div><p className="text-[10px] text-gray-400 mb-1">Email</p><p className="text-xs text-gray-900">{currentSelected.email||'—'}</p></div>
                <div><p className="text-[10px] text-gray-400 mb-1">Status</p><span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[getStatus(currentSelected)]||'bg-gray-100'}`}>{getStatus(currentSelected)}</span></div>
              </div>
            )}
            {rightTab === 'activity' && (
              <p className="text-xs text-gray-400 text-center py-8">No activity recorded</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
