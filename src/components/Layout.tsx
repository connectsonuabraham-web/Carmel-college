import React, { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useWebhookStream } from '../hooks/useWebhookStream'
import {
  LayoutDashboard, Phone, Menu, Megaphone,
  Bell, Settings, Download, LogOut, GraduationCap,
  RefreshCw, Radio, MessageCircle, MessagesSquare, FileText, Bot
} from 'lucide-react'

const navItems = [
  { to: '/',                        label: 'Overview',         icon: <LayoutDashboard className="w-4 h-4" /> },
  { to: '/calls',                   label: 'Voice Agents',     icon: <Phone className="w-4 h-4" /> },
  { to: '/whatsapp',                label: 'WhatsApp Agent',   icon: <MessageCircle className="w-4 h-4" /> },
  { to: '/whatsapp/conversations',  label: 'Conversations',    icon: <MessagesSquare className="w-4 h-4" /> },
  { to: '/templates',               label: 'Templates',        icon: <FileText className="w-4 h-4" /> },
  { to: '/campaigns-wa',            label: 'Campaigns',        icon: <Megaphone className="w-4 h-4" /> },
  { to: '/ai-assistant',            label: 'AI Assistant',     icon: <Bot className="w-4 h-4" /> },
]

const otherItems = [
  { to: '/settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
]

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()
  const { status: webhookStatus, lastCall } = useWebhookStream()

  // Flash "New call!" toast when webhook fires
  const [newCallToast, setNewCallToast] = useState(false)
  useEffect(() => {
    if (lastCall) {
      setNewCallToast(true)
      const t = setTimeout(() => setNewCallToast(false), 4000)
      return () => clearTimeout(t)
    }
  }, [lastCall])

  // Tick every second so the countdown is live
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [lastUpdated])

  // Auto-refresh every 62s and update the timestamp
  useEffect(() => {
    const id = setInterval(() => {
      queryClient.invalidateQueries()
      setLastUpdated(new Date())
    }, 62000)
    return () => clearInterval(id)
  }, [queryClient])

  async function handleManualRefresh() {
    setRefreshing(true)
    await queryClient.invalidateQueries()
    setLastUpdated(new Date())
    setSecondsAgo(0)
    setTimeout(() => setRefreshing(false), 800)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.05]">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-green-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm leading-tight truncate">Carmel College</p>
            <p className="text-[11px] text-[#475569] leading-tight truncate">of Nursing</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 py-4 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-[#475569] px-4 mb-1 mt-4">Main</p>
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? 'flex items-center gap-3 px-4 py-2 text-[13px] font-medium text-green-400 bg-green-500/[0.08] border-l-2 border-green-500'
                  : 'flex items-center gap-3 px-4 py-2 text-[13px] font-medium text-[#94a3b8] hover:bg-white/[0.03] hover:text-[#f1f5f9] transition-colors'
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>

        <p className="text-[10px] uppercase tracking-widest font-semibold text-[#475569] px-4 mb-1 mt-4">Settings</p>
        <div className="space-y-0.5">
          {otherItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? 'flex items-center gap-3 px-4 py-2 text-[13px] font-medium text-green-400 bg-green-500/[0.08] border-l-2 border-green-500'
                  : 'flex items-center gap-3 px-4 py-2 text-[13px] font-medium text-[#94a3b8] hover:bg-white/[0.03] hover:text-[#f1f5f9] transition-colors'
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* User profile */}
      <div className="px-3 py-4 border-t border-white/[0.05]">
        <div className="flex items-center gap-3 px-2 py-2 transition-colors">
          <div className="w-8 h-8 rounded-full bg-[#1a1d2e] flex items-center justify-center flex-shrink-0">
            <span className="text-green-400 font-bold text-xs">CC</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#f1f5f9] truncate">Carmel College</p>
            <p className="text-[11px] text-[#475569] truncate">admin@carmelcollege.edu</p>
          </div>
          <LogOut className="w-4 h-4 text-[#475569] hover:text-red-400 flex-shrink-0 cursor-pointer transition-colors" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f1117] flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 flex-shrink-0 bg-[#0f1117] border-r border-white/[0.05]">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="w-60 bg-[#0f1117] border-r border-white/[0.05] flex flex-col shadow-xl">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0f1117]">
        {/* Top bar */}
        <header className="bg-[#0f1117] border-b border-white/[0.05] h-14 flex items-center px-6 gap-4 flex-shrink-0">
          <button
            className="md:hidden p-1.5 rounded-lg text-[#94a3b8] hover:text-[#f1f5f9]"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Page title */}
          <span className="text-[15px] font-semibold text-[#f1f5f9] mr-auto">Dashboard</span>

          <div className="flex items-center gap-2">
            {/* Webhook live badge */}
            {webhookStatus === 'connected' && (
              <span className="hidden sm:flex items-center gap-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-md px-2 py-0.5 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live
              </span>
            )}
            {webhookStatus === 'disconnected' && (
              <span className="hidden sm:flex items-center gap-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md px-2 py-0.5 text-[11px]">
                <Radio className="w-4 h-4" />
                Reconnecting
              </span>
            )}

            {/* New call toast */}
            {newCallToast && (
              <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-white bg-green-500 px-3 py-1 rounded-md animate-pulse">
                📞 New call received!
              </span>
            )}

            <span className="text-[11px] text-[#475569] hidden sm:block">
              {secondsAgo < 5 ? 'Just updated' : `Updated ${secondsAgo}s ago`}
            </span>

            <button
              onClick={handleManualRefresh}
              title="Refresh data now"
              className={`bg-[#1a1d2e] border border-white/[0.06] text-[#94a3b8] hover:text-[#f1f5f9] rounded-lg p-2 transition-colors ${refreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button className="bg-[#1a1d2e] border border-white/[0.06] text-[#94a3b8] hover:text-[#f1f5f9] rounded-lg p-2 transition-colors">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#0f1117]">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
