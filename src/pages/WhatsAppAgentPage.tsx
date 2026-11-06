import React, { useState } from 'react'
import { MessageCircle, Phone, CheckCircle2, BarChart3, Users, Zap, Calendar, TrendingUp, Edit3, Pause, Info } from 'lucide-react'
import { useLeads, useConversations, useAiOffLeads } from '../hooks/useSetSmart'
import type { Conversation } from '../api/setsmart'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

function buildActivityChart(conversations: Conversation[]) {
  const days = ['Nov 1', 'Nov 5', 'Nov 10', 'Nov 15', 'Nov 20', 'Nov 25', 'Nov 30']
  return days.map((d, i) => ({ date: d, conversations: Math.max(0, (conversations.length * (i + 1)) % 150) }))
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??'
}

export function WhatsAppAgentPage() {
  const { data: leads = [] } = useLeads()
  const { data: convsResp } = useConversations()
  const { data: aiOff = [] } = useAiOffLeads()
  const [aiLocalActive, setAiLocalActive] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'assistant' | 'knowledge' | 'followups' | 'templates' | 'settings'>('overview')

  const conversations = convsResp?.conversations ?? []
  const totalConversations = convsResp?.total ?? 0
  const totalLeads = leads.length
  const bookedLeads = leads.filter(l => l.ok_call !== 'N/A').length
  const aiActive = leads.length - aiOff.length
  const totalMessages = conversations.reduce((s, c) => s + (c.message_count ?? 0), 0)
  const assistantId = leads[0]?.assistant_id ?? 'asst_hqrN2ycoPOmNKG4kdG16IhsmV3wX03nt'

  const chartData = buildActivityChart(conversations)
  const recentConvs = [...conversations]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5)

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'assistant', label: 'Assistant' },
    { id: 'knowledge', label: 'Knowledge Base' },
    { id: 'followups', label: 'Follow-ups' },
    { id: 'templates', label: 'Templates' },
    { id: 'settings', label: 'Settings' },
  ] as const

  const phoneNumber = leads[0]?.number || 'Connected'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap gap-4 items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-\[#0f1a14\]">WhatsApp Agent</h1>
          <p className="text-sm text-\[#7b857f\] mt-0.5">Manage your WhatsApp connection, AI assistant and conversations.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 border border-\[#e8ebe8\] rounded-lg px-4 py-2 text-sm font-medium text-\[#7b857f\] hover:bg-\[#f5f6f4\]">
            <MessageCircle size={15} /> Test Assistant
          </button>
          <button className="flex items-center gap-2 bg-\[#1f6b47\] hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
            Save Changes
          </button>
        </div>
      </div>

      {/* Connection status bar */}
      <div className="bg-white rounded-\[16px\] border border-\[#e8ebe8\] p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-\[#d8f58f\]/60 flex items-center justify-center">
              <MessageCircle size={20} className="text-green-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-\[#0f1a14\] text-sm">WhatsApp Connected</p>
                <span className="flex items-center gap-1 text-xs text-\[#1f6b47\] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-\[#a6e22e\] inline-block" /> Connected
                </span>
              </div>
              <p className="text-xs text-\[#7b857f\]">Your WhatsApp Business account is active and synced.</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Phone size={13} className="text-\[#7b857f\]" />
            <span className="text-xs text-\[#7b857f\]">Phone Number</span>
            <span className="text-sm font-semibold text-\[#0f1a14\] ml-1">{phoneNumber}</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 size={13} className="text-green-500" />
            <span className="text-xs text-\[#7b857f\]">Business Name</span>
            <span className="text-sm font-semibold text-\[#0f1a14\] ml-1">Carmel College of Nursing</span>
          </div>
          <div>
            <span className="text-xs text-\[#7b857f\]">Quality</span>
            <span className="ml-2 text-xs font-semibold text-\[#1f6b47\] bg-\[#d8f58f\]/60 px-2 py-0.5 rounded-full">High</span>
          </div>
          <div className="ml-auto">
            <button className="flex items-center gap-1.5 border border-\[#e8ebe8\] rounded-lg px-3 py-1.5 text-xs font-medium text-\[#7b857f\] hover:bg-\[#f5f6f4\]">
              Manage Connection ↗
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-\[#f5f6f4\] rounded-\[16px\] p-1 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === t.id ? 'bg-white text-\[#1f6b47\]' : 'text-\[#7b857f\] hover:text-\[#7b857f\]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* AI Assistant Status */}
            <div className="bg-white rounded-\[16px\] border border-\[#e8ebe8\] p-5">
              <h3 className="text-sm font-semibold text-\[#0f1a14\] mb-4 flex items-center gap-2">
                <Zap size={15} className="text-green-500" /> AI Assistant Status
              </h3>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${aiLocalActive ? 'bg-\[#a6e22e\]' : 'bg-white/20'}`} />
                  <span className="text-sm font-medium text-\[#0f1a14\]">{aiLocalActive ? 'Active' : 'Paused'}</span>
                </div>
                <button onClick={() => setAiLocalActive(!aiLocalActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${aiLocalActive ? 'bg-\[#1f6b47\]' : 'bg-white/20'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${aiLocalActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <p className="text-xs text-\[#7b857f\] mb-4">Automatically responds to incoming WhatsApp enquiries.</p>
              <button onClick={() => setAiLocalActive(!aiLocalActive)}
                className="w-full flex items-center justify-center gap-2 border border-\[#e8ebe8\] rounded-lg py-2 text-sm font-medium text-\[#7b857f\] hover:bg-\[#f5f6f4\] mb-3">
                <Pause size={13} /> {aiLocalActive ? 'Pause AI' : 'Resume AI'}
              </button>
              <div className="bg-orange-50 border border-amber-500/20 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info size={12} className="text-\[#f0883e\] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-\[#f0883e\] opacity-90">AI control is managed per-conversation in the Conversations section or via setsmart.io</p>
                </div>
                {aiOff.length > 0 && <p className="text-xs text-\[#f0883e\] mt-1 font-medium">{aiOff.length} conversation{aiOff.length > 1 ? 's' : ''} with AI paused</p>}
              </div>
            </div>

            {/* Assistant Performance */}
            <div className="bg-white rounded-\[16px\] border border-\[#e8ebe8\] p-5">
              <h3 className="text-sm font-semibold text-\[#0f1a14\] mb-4 flex items-center gap-2">
                <BarChart3 size={15} className="text-green-500" /> Assistant Performance
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Total conversations', value: totalConversations, icon: <MessageCircle size={16} className="text-green-500" /> },
                  { label: 'Total leads', value: totalLeads, icon: <Users size={16} className="text-green-500" /> },
                  { label: 'Booked leads', value: bookedLeads, icon: <Calendar size={16} className="text-green-500" /> },
                  { label: 'AI active chats', value: aiActive, icon: <Zap size={16} className="text-green-500" /> },
                  { label: 'Total messages', value: totalMessages, icon: <TrendingUp size={16} className="text-green-500" /> },
                  { label: 'Assistant ID', value: assistantId.slice(0, 12) + '…', icon: <MessageCircle size={16} className="text-green-500" /> },
                ].map((s, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    {s.icon}
                    <p className="text-xl font-bold text-\[#0f1a14\]">{s.value}</p>
                    <p className="text-[10px] text-\[#7b857f\] leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Conversation Activity */}
            <div className="bg-white rounded-\[16px\] border border-\[#e8ebe8\] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-\[#0f1a14\] flex items-center gap-2">
                  <TrendingUp size={15} className="text-green-500" /> Conversation Activity
                </h3>
                <select className="text-xs border border-\[#e8ebe8\] bg-white rounded-lg px-2 py-1 text-\[#7b857f\]">
                  <option>This Month</option>
                  <option>Last Month</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#475569' }} />
                  <Tooltip contentStyle={{ background: '#1a1d2e', border: '1px solid rgba(255,255,255,0.06)', color: '#94a3b8' }} />
                  <Line type="monotone" dataKey="conversations" stroke="#4CAF50" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* WhatsApp Business Profile */}
            <div className="bg-white rounded-\[16px\] border border-\[#e8ebe8\] p-5">
              <h3 className="text-sm font-semibold text-\[#0f1a14\] mb-4 flex items-center gap-2">
                <MessageCircle size={15} className="text-green-500" /> WhatsApp Business Profile
              </h3>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-14 h-14 rounded-\[16px\] bg-\[#d8f58f\]/60 flex items-center justify-center flex-shrink-0">
                  <span className="text-\[#1f6b47\] font-bold text-lg">CC</span>
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <p className="font-semibold text-\[#0f1a14\] text-sm">Carmel College of Nursing</p>
                    <CheckCircle2 size={13} className="text-green-500" />
                  </div>
                  <p className="text-xs text-\[#7b857f\] mt-1 leading-relaxed">Admissions, courses, eligibility, fees and counselling assistance for Carmel College.</p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-\[#7b857f\] mb-4">
                <div className="flex items-center gap-2">✉ admissions@carmelcollege.edu</div>
                <div className="flex items-center gap-2">🌐 carmelcollege.edu</div>
              </div>
              <button className="w-full flex items-center justify-center gap-2 border border-\[#e8ebe8\] rounded-lg py-2 text-sm font-medium text-\[#7b857f\] hover:bg-\[#f5f6f4\]">
                <Edit3 size={13} /> Edit Profile
              </button>
            </div>

            {/* Recent Conversations */}
            <div className="bg-white rounded-\[16px\] border border-\[#e8ebe8\] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-\[#0f1a14\]">Recent Conversations</h3>
                <a href="/whatsapp/conversations" className="text-xs text-green-500 font-medium hover:underline">View All →</a>
              </div>
              {recentConvs.length === 0 ? (
                <p className="text-xs text-\[#7b857f\] py-4 text-center">No conversations yet</p>
              ) : (
                <div className="space-y-3">
                  {recentConvs.map((conv: Conversation, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-\[#d8f58f\]/60 flex items-center justify-center flex-shrink-0">
                        <span className="text-\[#1f6b47\] text-xs font-bold">{getInitials(conv.contact.name)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-\[#0f1a14\] truncate">{conv.contact.name}</p>
                        <p className="text-[10px] text-\[#7b857f\] truncate">{conv.messages[conv.messages.length - 1]?.content ?? ''}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-\[#f5f6f4\] text-\[#7b857f\] font-medium">{conv.qualification.status ?? 'New'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Usage */}
            <div className="bg-white rounded-\[16px\] border border-\[#e8ebe8\] p-5">
              <h3 className="text-sm font-semibold text-\[#0f1a14\] mb-4">AI Usage Summary</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-\[#7b857f\] font-medium">Total Messages</span>
                    <span className="text-xs text-\[#0f1a14\] font-semibold">{totalMessages.toLocaleString()}</span>
                  </div>
                  <div className="h-2.5 bg-\[#f5f6f4\] rounded-full overflow-hidden">
                    <div className="h-full bg-\[#a6e22e\] rounded-full" style={{ width: totalMessages > 0 ? '60%' : '0%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-\[#7b857f\] font-medium">Conversations</span>
                    <span className="text-xs text-\[#0f1a14\] font-semibold">{totalConversations.toLocaleString()}</span>
                  </div>
                  <div className="h-2.5 bg-\[#f5f6f4\] rounded-full overflow-hidden">
                    <div className="h-full bg-green-400 rounded-full" style={{ width: totalConversations > 0 ? '40%' : '0%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-\[#7b857f\] font-medium">Leads Booked</span>
                    <span className="text-xs text-\[#0f1a14\] font-semibold">{bookedLeads.toLocaleString()}</span>
                  </div>
                  <div className="h-2.5 bg-\[#f5f6f4\] rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400 rounded-full" style={{ width: bookedLeads > 0 && totalLeads > 0 ? `${Math.min(100, Math.round((bookedLeads / totalLeads) * 100))}%` : '0%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab !== 'overview' && (
        <div className="bg-white border border-\[#e8ebe8\] rounded-\[16px\] p-10 text-center">
          <MessageCircle size={32} className="text-\[#7b857f\] mx-auto mb-3" />
          <p className="text-sm text-\[#7b857f\] font-medium">Configure {tabs.find(t => t.id === activeTab)?.label} settings</p>
          <p className="text-xs text-\[#7b857f\] mt-1">Coming soon</p>
        </div>
      )}
    </div>
  )
}
