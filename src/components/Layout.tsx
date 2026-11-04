import React, { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useWebhookStream } from '../hooks/useWebhookStream'
import {
  LayoutDashboard, Phone, PhoneCall, BarChart3, Menu, Megaphone,
  Layers, LayoutGrid, Bell, Settings, Download, LogOut, GraduationCap,
  RefreshCw, Radio, Zap, MessageCircle, MessageSquare, Users
} from 'lucide-react'

const navItems = [
  { to: '/',                        label: 'Overview',         icon: <LayoutDashboard size={18} /> },
  { to: '/live-calls',              label: 'Live Calls',       icon: <Zap size={18} /> },
  { to: '/calls',                   label: 'Call Logs',        icon: <Phone size={18} /> },
  { to: '/attempts',                label: 'Attempts',         icon: <PhoneCall size={18} /> },
  { to: '/analytics',               label: 'Analytics',        icon: <BarChart3 size={18} /> },
  { to: '/whatsapp',                label: 'WhatsApp Agent',   icon: <MessageCircle size={18} /> },
  { to: '/whatsapp/conversations',  label: 'Conversations',    icon: <MessageSquare size={18} /> },
  { to: '/whatsapp/leads',          label: 'Leads & CRM',      icon: <Users size={18} /> },
]

const otherItems = [
  { to: '/campaigns', label: 'Campaigns', icon: <Megaphone size={18} /> },
  { to: '/group-by',  label: 'Group By',  icon: <Layers size={18} /> },
  { to: '/boards',    label: 'Boards',    icon: <LayoutGrid size={18} /> },
  { to: '/settings',  label: 'Settings',  icon: <Settings size={18} /> },
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
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-tight truncate">Carmel College</p>
            <p className="font-medium text-green-600 text-xs leading-tight truncate">of Nursing</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Main Menu</p>
        <div className="space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-500 text-white'
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>

        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mt-5 mb-2">Other</p>
        <div className="space-y-0.5">
          {otherItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-500 text-white'
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* User profile */}
      <div className="px-3 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-green-50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <span className="text-green-700 font-bold text-xs">CC</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-gray-900 truncate">Carmel College</p>
            <p className="text-[10px] text-gray-400 truncate">admin@carmelcollege.edu</p>
          </div>
          <LogOut size={14} className="text-gray-400 flex-shrink-0" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#e8f5e9] p-3">
      <div className="bg-white rounded-3xl shadow-lg overflow-hidden flex h-[calc(100vh-24px)]">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col w-[220px] flex-shrink-0 bg-white border-r border-gray-100">
          <SidebarContent />
        </aside>

        {/* Mobile sidebar overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="w-[220px] bg-white flex flex-col shadow-xl">
              <SidebarContent />
            </div>
            <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
          </div>
        )}

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-100 flex-shrink-0">
            <button
              className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={18} />
            </button>

            <div className="flex-1 hidden md:block">
              <div className="relative max-w-xs">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  type="text"
                  placeholder="Search calls, callers…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-full border border-gray-200 bg-gray-50 pl-8 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Webhook live badge */}
              {webhookStatus === 'connected' && (
                <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Live
                </span>
              )}
              {webhookStatus === 'disconnected' && (
                <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 px-2.5 py-1 rounded-full">
                  <Radio size={11} />
                  Reconnecting
                </span>
              )}

              {/* New call toast */}
              {newCallToast && (
                <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-white bg-green-500 px-3 py-1 rounded-full animate-pulse">
                  📞 New call received!
                </span>
              )}

              <span className="text-xs text-gray-400 hidden sm:block">
                {secondsAgo < 5 ? 'Just updated' : `Updated ${secondsAgo}s ago`}
              </span>
              <button
                onClick={handleManualRefresh}
                title="Refresh data now"
                className={`p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors ${refreshing ? 'animate-spin text-green-500' : ''}`}
              >
                <RefreshCw size={16} />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <Bell size={16} />
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <Settings size={16} />
              </button>
              <button className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <Download size={14} />
                Export
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 p-5">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
