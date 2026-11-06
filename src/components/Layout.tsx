import React, { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useWebhookStream } from '../hooks/useWebhookStream'
import { RefreshCw } from 'lucide-react'

const NAV: { section: string; items: { to: string; label: string; end?: boolean }[] }[] = [
  { section: 'MENU', items: [
    { to: '/', label: 'Overview', end: true },
  ]},
  { section: 'VOICE AGENT', items: [
    { to: '/calls',      label: 'Analytics' },
    { to: '/live-calls', label: 'Call Logs' },
  ]},
  { section: 'WHATSAPP AGENT', items: [
    { to: '/whatsapp',                   label: 'Analytics' },
    { to: '/whatsapp/conversations',     label: 'Messenger' },
  ]},
  { section: 'GENERAL', items: [
    { to: '/settings',      label: 'Live Controls' },
    { to: '/integrations',  label: 'Integrations' },
  ]},
]

const PAGE_TITLES: Record<string, string> = {
  '/':                         'Overview',
  '/calls':                    'Voice Analytics',
  '/live-calls':               'Call Logs',
  '/whatsapp':                 'WhatsApp Analytics',
  '/whatsapp/conversations':   'Messenger',
  '/settings':                 'Live Controls',
  '/integrations':             'Integrations',
}

// SVG icons matching the HTML reference
const Icons: Record<string, JSX.Element> = {
  grid:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg>,
  phone: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>,
  list:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>,
  chat:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M4 5h16v11H9l-5 4z"/></svg>,
  send:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M3 11l18-8-8 18-2-8z"/></svg>,
  gear:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg>,
  link:  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>,
  search:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4"/></svg>,
  download:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>,
}

const NAV_ICONS: Record<string, JSX.Element> = {
  '/':                       Icons.grid,
  '/calls':                  Icons.phone,
  '/live-calls':             Icons.list,
  '/whatsapp':               Icons.chat,
  '/whatsapp/conversations': Icons.send,
  '/settings':               Icons.gear,
  '/integrations':           Icons.link,
}

export function Layout() {
  const location = useLocation()
  const queryClient = useQueryClient()
  const { status: webhookStatus, lastCall } = useWebhookStream()
  const [refreshing, setRefreshing] = useState(false)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [newCallToast, setNewCallToast] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (lastCall) {
      setNewCallToast(true)
      const t = setTimeout(() => setNewCallToast(false), 4000)
      return () => clearTimeout(t)
    }
  }, [lastCall])

  useEffect(() => {
    const id = setInterval(() => setSecondsAgo(Math.floor((Date.now() - lastUpdated.getTime()) / 1000)), 1000)
    return () => clearInterval(id)
  }, [lastUpdated])

  useEffect(() => {
    const id = setInterval(() => { queryClient.invalidateQueries(); setLastUpdated(new Date()) }, 62000)
    return () => clearInterval(id)
  }, [queryClient])

  async function handleRefresh() {
    setRefreshing(true)
    await queryClient.invalidateQueries()
    setLastUpdated(new Date())
    setSecondsAgo(0)
    setTimeout(() => setRefreshing(false), 800)
  }

  const pageTitle = Object.entries(PAGE_TITLES).find(([path]) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  })?.[1] ?? 'Dashboard'

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', overflow: 'hidden', background: '#d4d5d8' }}>
      <div style={{ display: 'flex', width: '100%', height: '100%', background: '#fff', overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <aside style={{
          width: 224, flexShrink: 0,
          background: '#0b3322', color: '#cfe3d7',
          padding: '22px 14px', display: 'flex', flexDirection: 'column',
          overflow: 'auto',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fff', fontWeight: 700, fontSize: 17, margin: '0 8px 26px' }}>
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: '#a6e22e', display: 'grid', placeItems: 'center', color: '#0b3322',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>
              </svg>
            </div>
            Carmel AI
          </div>

          {/* Nav */}
          <nav>
            {NAV.map((group) => (
              <React.Fragment key={group.section}>
                <div style={{
                  fontSize: 10, letterSpacing: '0.12em', color: '#7da58d',
                  margin: '18px 10px 8px', fontWeight: 600, textTransform: 'uppercase',
                }}>
                  {group.section}
                </div>
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    style={({ isActive }) => ({
                      all: 'unset' as const,
                      boxSizing: 'border-box' as const,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 11,
                      padding: '10px 12px',
                      borderRadius: 11,
                      width: '100%',
                      fontWeight: 500,
                      position: 'relative' as const,
                      color: isActive ? '#fff' : '#cfe3d7',
                      background: isActive ? 'rgba(255,255,255,0.11)' : 'transparent',
                      marginBottom: 1,
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <div style={{
                            position: 'absolute', left: -14, top: 9, bottom: 9,
                            width: 4, borderRadius: '0 4px 4px 0', background: '#a6e22e',
                          }} />
                        )}
                        <span style={{ opacity: isActive ? 1 : 0.7 }}>{NAV_ICONS[item.to]}</span>
                        {item.label}
                      </>
                    )}
                  </NavLink>
                ))}
              </React.Fragment>
            ))}
          </nav>

          {/* User */}
          <div style={{
            marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.11)',
            paddingTop: 14, display: 'flex', gap: 10, alignItems: 'center', color: '#fff', fontWeight: 600,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: '#a6e22e', color: '#0b3322',
              display: 'grid', placeItems: 'center',
              fontStyle: 'normal', fontWeight: 800, fontSize: 14,
            }}>A</div>
            <div>
              Admissions Desk
              <div style={{ color: '#7da58d', fontWeight: 400, fontSize: 11 }}>admissions@carmel.edu</div>
            </div>
          </div>
        </aside>

        {/* ── Main ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

          {/* Topbar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '16px 26px', borderBottom: '1px solid #e8ebe8', background: '#fff', flexShrink: 0,
          }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginRight: 'auto', color: '#0f1a14', margin: '0 auto 0 0' }}>
              {pageTitle}
            </h2>

            {/* Search */}
            <div style={{
              display: 'flex', gap: 8, alignItems: 'center',
              border: '1px solid #e8ebe8', borderRadius: 99,
              padding: '8px 14px', width: 260, color: '#7b857f',
            }}>
              {Icons.search}
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search leads, calls, chats"
                style={{
                  border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 13, color: '#0f1a14', width: '100%',
                }}
              />
            </div>

            {/* Date pill */}
            <div style={{
              display: 'inline-flex', gap: 7, alignItems: 'center',
              border: '1px solid #e8ebe8', borderRadius: 99,
              padding: '8px 14px', fontWeight: 600, fontSize: 12, color: '#0f1a14', whiteSpace: 'nowrap',
            }}>
              {Icons.grid} Nov 1 – Nov 6, 2026
            </div>

            {/* Webhook status */}
            {webhookStatus === 'connected' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                border: '1px solid #e8ebe8', borderRadius: 99, padding: '6px 12px',
                fontSize: 11, fontWeight: 600, color: '#1f6b47',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#a6e22e' }} />
                Live
              </div>
            )}

            {newCallToast && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#a6e22e', color: '#0b3322',
                borderRadius: 99, padding: '6px 14px', fontSize: 11, fontWeight: 700,
              }}>
                📞 New call
              </div>
            )}

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              style={{
                border: '1px solid #e8ebe8', borderRadius: 99, padding: '8px 10px',
                background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
                color: '#7b857f',
              }}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            </button>

            {/* Export */}
            <button
              onClick={() => {}}
              style={{
                background: '#a6e22e', color: '#0b3322',
                borderRadius: 99, padding: '9px 16px',
                fontWeight: 600, fontSize: 12, border: 'none', cursor: 'pointer',
                display: 'inline-flex', gap: 7, alignItems: 'center',
              }}
            >
              {Icons.download} Export
            </button>
          </div>

          {/* Page content */}
          <main style={{ flex: 1, overflow: 'auto', padding: '22px 26px 30px', background: '#f5f6f4' }}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
