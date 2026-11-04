import React, { useState } from 'react'
import { Search, Users, CheckCircle2, Calendar, Zap, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSetSmartLeads, useSetSmartOkCalls, useSetSmartAnswered } from '../hooks/useSetSmart'
import type { SetSmartLead } from '../types/setsmart'

function getName(l: SetSmartLead) { return l.name || l.firstName || l.phone || 'Unknown' }
function getStatus(l: SetSmartLead) { return l.status || l.leadStatus || 'New' }

const STATUS_COLORS: Record<string,string> = {
  Qualified: 'bg-green-100 text-green-700',
  Booked: 'bg-blue-100 text-blue-700',
  Open: 'bg-gray-100 text-gray-600',
  New: 'bg-yellow-100 text-yellow-700',
  'Not Interested': 'bg-red-100 text-red-600',
}

const PAGE_SIZE = 20

export function WhatsAppLeadsPage() {
  const { data: leads = [], isFetching } = useSetSmartLeads()
  const { data: okCalls = [] } = useSetSmartOkCalls()
  const { data: answered = [] } = useSetSmartAnswered()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(0)

  const allLeads = [...new Map([...leads, ...okCalls, ...answered].map((l: SetSmartLead) => [l.phone||l.id||l._id||String(Math.random()), l])).values()]

  const filtered = allLeads.filter((l: SetSmartLead) => {
    const n = getName(l).toLowerCase()
    const matchSearch = !search || n.includes(search.toLowerCase()) || (l.phone||'').includes(search)
    const matchFilter = filter === 'all' || getStatus(l).toLowerCase() === filter.toLowerCase()
    return matchSearch && matchFilter
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page+1) * PAGE_SIZE)

  const stats = [
    { label: 'Total Leads', value: allLeads.length, icon: <Users size={18} className="text-green-500" /> },
    { label: 'Qualified', value: allLeads.filter((l: SetSmartLead)=>getStatus(l)==='Qualified').length, icon: <CheckCircle2 size={18} className="text-green-500" /> },
    { label: 'Booked', value: allLeads.filter((l: SetSmartLead)=>getStatus(l)==='Booked').length, icon: <Calendar size={18} className="text-blue-500" /> },
    { label: 'AI Active', value: allLeads.filter((l: SetSmartLead)=>l.aiEnabled!==false).length, icon: <Zap size={18} className="text-yellow-500" /> },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads & CRM</h1>
          <p className="text-sm text-gray-500 mt-0.5">{allLeads.length} total leads from WhatsApp</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s,i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">{s.icon}</div>
            <div><p className="text-xl font-bold text-gray-900">{s.value}</p><p className="text-xs text-gray-400">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0)}}
            placeholder="Search leads..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300" />
        </div>
        <select value={filter} onChange={e=>{setFilter(e.target.value);setPage(0)}}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300">
          <option value="all">All Status</option>
          <option value="Qualified">Qualified</option>
          <option value="Booked">Booked</option>
          <option value="Open">Open</option>
          <option value="New">New</option>
          <option value="Not Interested">Not Interested</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Contact','Phone','Last Message','Last Activity','AI','Status','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isFetching && paged.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">Loading…</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No leads found. Send your first WhatsApp message to get started.</td></tr>
            ) : paged.map((lead: SetSmartLead,i: number) => (
              <tr key={i} className="hover:bg-green-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-700 text-[10px] font-bold">{getName(lead).slice(0,2).toUpperCase()}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{getName(lead)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{lead.phone||lead.phoneNumber||'—'}</td>
                <td className="px-4 py-3 max-w-[180px]">
                  <p className="text-xs text-gray-600 truncate">{lead.lastMessage||'—'}</p>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{lead.lastActivity||lead.updatedAt||'—'}</td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1 text-xs font-medium ${lead.aiEnabled!==false?'text-green-600':'text-gray-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${lead.aiEnabled!==false?'bg-green-500':'bg-gray-300'}`}/>
                    {lead.aiEnabled!==false?'On':'Off'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[getStatus(lead)]||'bg-gray-100 text-gray-600'}`}>{getStatus(lead)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button className="text-[10px] border border-gray-200 rounded px-2 py-1 hover:bg-green-50 text-gray-600 hover:text-green-600 transition-colors">View</button>
                    <button className="text-[10px] border border-gray-200 rounded px-2 py-1 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors">Book</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{page*PAGE_SIZE+1}–{Math.min((page+1)*PAGE_SIZE,filtered.length)} of {filtered.length}</p>
            <div className="flex gap-2">
              <button disabled={page===0} onClick={()=>setPage(p=>p-1)} className="p-1.5 rounded border disabled:opacity-40 hover:bg-green-50"><ChevronLeft size={14}/></button>
              <button disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)} className="p-1.5 rounded border disabled:opacity-40 hover:bg-green-50"><ChevronRight size={14}/></button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
