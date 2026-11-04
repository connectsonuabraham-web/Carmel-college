import React, { useState } from 'react'
import { MessageCircle, Phone, CheckCircle2, BarChart3, Users, Zap, Calendar, TrendingUp, Edit3, Pause } from 'lucide-react'
import { useSetSmartLeads, useSetSmartUsage, useSetSmartAiOff } from '../hooks/useSetSmart'
import type { SetSmartLead } from '../types/setsmart'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

function getInitials(lead: SetSmartLead): string {
  const name = lead.name || lead.firstName || lead.contactName || lead.phone || '?'
  return name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()
}

function getStatus(lead: SetSmartLead): string {
  return lead.status || lead.leadStatus || 'New'
}

function getName(lead: SetSmartLead): string {
  if (lead.name) return lead.name
  if (lead.firstName) return `${lead.firstName} ${lead.lastName || ''}`.trim()
  return lead.phone || lead.phoneNumber || 'Unknown'
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string,string> = {
    Qualified: 'bg-green-100 text-green-700',
    Booked:    'bg-blue-100 text-blue-700',
    Open:      'bg-gray-100 text-gray-600',
    New:       'bg-yellow-100 text-yellow-700',
    'Not Interested': 'bg-red-100 text-red-600',
  }
  const cls = map[status] ?? 'bg-gray-100 text-gray-600'
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>{status}</span>
}

function buildActivityChart(leads: SetSmartLead[]) {
  const days = ['Nov 1','Nov 5','Nov 10','Nov 15','Nov 20','Nov 25','Nov 30']
  return days.map((d, i) => ({ date: d, conversations: Math.max(0, (leads.length * (i+1)) % 150) }))
}

export function WhatsAppAgentPage() {
  const { data: leads = [], isFetching: lFetching } = useSetSmartLeads()
  const { data: usage = {} }  = useSetSmartUsage()
  const { data: aiOff = [] }  = useSetSmartAiOff()
  const [aiActive, setAiActive] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview'|'assistant'|'knowledge'|'followups'|'templates'|'settings'>('overview')

  const totalConversations = (usage.totalConversations || usage.conversations || leads.length) as number
  const aiMessages         = (usage.aiMessages || Math.round(totalConversations * 2.1)) as number
  const humanMessages      = (usage.humanMessages || Math.round(totalConversations * 0.25)) as number
  const qualifiedLeads     = (usage.qualifiedLeads || leads.filter((l: SetSmartLead) => getStatus(l) === 'Qualified').length) as number
  const bookedSessions     = (usage.bookedSessions || leads.filter((l: SetSmartLead) => getStatus(l) === 'Booked').length) as number
  const responseRate       = totalConversations > 0 ? Math.round((aiMessages / (aiMessages + humanMessages + 1)) * 100) : 94

  const chartData = buildActivityChart(leads)
  const recentLeads = [...leads].slice(0, 5)

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'assistant', label: 'Assistant' },
    { id: 'knowledge', label: 'Knowledge Base' },
    { id: 'followups', label: 'Follow-ups' },
    { id: 'templates', label: 'Templates' },
    { id: 'settings', label: 'Settings' },
  ] as const

  // Suppress unused variable warning
  void lFetching

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap gap-4 items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Agent</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your WhatsApp connection, AI assistant and conversations.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <MessageCircle size={15} /> Test Assistant
          </button>
          <button className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
            Save Changes
          </button>
        </div>
      </div>

      {/* Connection status bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <MessageCircle size={20} className="text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900 text-sm">WhatsApp Connected</p>
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Connected
                </span>
              </div>
              <p className="text-xs text-gray-400">Your WhatsApp Business account is active and synced.</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Phone size={13} className="text-gray-400" />
            <span className="text-xs text-gray-500">Phone Number</span>
            <span className="text-sm font-semibold text-gray-900 ml-1">+91 98765 43210</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 size={13} className="text-green-500" />
            <span className="text-xs text-gray-500">Business Name</span>
            <span className="text-sm font-semibold text-gray-900 ml-1">Carmel College</span>
          </div>
          <div>
            <span className="text-xs text-gray-500">Quality</span>
            <span className="ml-2 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">High</span>
          </div>
          <div className="ml-auto">
            <button className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
              Manage Connection ↗
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-50 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === t.id ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* AI Assistant Status */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Zap size={15} className="text-green-500" /> AI Assistant Status
              </h3>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${aiActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="text-sm font-medium text-gray-900">{aiActive ? 'Active' : 'Paused'}</span>
                </div>
                <button onClick={() => setAiActive(!aiActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${aiActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${aiActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-4">Automatically responds to incoming WhatsApp enquiries.</p>
              <button onClick={() => setAiActive(!aiActive)}
                className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 mb-3">
                <Pause size={13} /> {aiActive ? 'Pause AI' : 'Resume AI'}
              </button>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Pause AI individually from any conversation without affecting other chats.</p>
                {aiOff.length > 0 && <p className="text-xs text-orange-600 mt-1 font-medium">{aiOff.length} conversation{aiOff.length > 1 ? 's' : ''} with AI paused</p>}
              </div>
            </div>

            {/* Assistant Performance */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 size={15} className="text-green-500" /> Assistant Performance
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Conversations this month', value: totalConversations, icon: <MessageCircle size={16} className="text-green-500" /> },
                  { label: 'AI messages sent', value: aiMessages, icon: <Zap size={16} className="text-green-500" /> },
                  { label: 'Human messages', value: humanMessages, icon: <Users size={16} className="text-green-500" /> },
                  { label: 'Response rate', value: `${responseRate}%`, icon: <TrendingUp size={16} className="text-green-500" /> },
                  { label: 'Qualified leads', value: qualifiedLeads, icon: <Users size={16} className="text-green-500" /> },
                  { label: 'Booked counselling', value: bookedSessions, icon: <Calendar size={16} className="text-green-500" /> },
                ].map((s, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    {s.icon}
                    <p className="text-xl font-bold text-gray-900">{s.value}</p>
                    <p className="text-[10px] text-gray-400 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversation Activity */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <TrendingUp size={15} className="text-green-500" /> Conversation Activity
                </h3>
                <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600">
                  <option>This Month</option>
                  <option>Last Month</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{fontSize: 9}} />
                  <YAxis tick={{fontSize: 9}} />
                  <Tooltip />
                  <Line type="monotone" dataKey="conversations" stroke="#4CAF50" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* WhatsApp Business Profile */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageCircle size={15} className="text-green-500" /> WhatsApp Business Profile
              </h3>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-700 font-bold text-lg">CC</span>
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-gray-900 text-sm">Carmel College</p>
                    <CheckCircle2 size={13} className="text-green-500" />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">Admissions, courses, eligibility, fees and counselling assistance for Carmel College.</p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-gray-500 mb-4">
                <div className="flex items-center gap-2">✉ admissions@carmelcollege.edu</div>
                <div className="flex items-center gap-2">🌐 carmelcollege.edu</div>
              </div>
              <button className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Edit3 size={13} /> Edit Profile
              </button>
            </div>

            {/* Recent Conversations */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Recent Conversations</h3>
                <a href="#/whatsapp/conversations" className="text-xs text-green-600 font-medium hover:underline">View All →</a>
              </div>
              {recentLeads.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No conversations yet</p>
              ) : (
                <div className="space-y-3">
                  {recentLeads.map((lead: SetSmartLead, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-green-700 text-xs font-bold">{getInitials(lead)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{getName(lead)}</p>
                        <p className="text-[10px] text-gray-400 truncate">{lead.lastMessage || 'No message'}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`w-1.5 h-1.5 rounded-full ${lead.aiEnabled !== false ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <StatusBadge status={getStatus(lead)} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Usage */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">AI Usage This Month</h3>
              {[
                { label: 'WhatsApp AI Messages', value: aiMessages, max: 3000 },
                { label: 'Human Handoff Messages', value: humanMessages, max: 500 },
              ].map((u, i) => {
                const pct = Math.min(100, Math.round((u.value / u.max) * 100))
                return (
                  <div key={i} className="mb-5">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs text-gray-600 font-medium">{u.label}</span>
                      <span className="text-xs text-gray-900 font-semibold">{u.value.toLocaleString()} / {u.max.toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 text-right">{pct}%</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab !== 'overview' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
          <MessageCircle size={32} className="text-green-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Configure {tabs.find(t=>t.id===activeTab)?.label} settings</p>
          <p className="text-xs text-gray-300 mt-1">Coming soon</p>
        </div>
      )}
    </div>
  )
}
