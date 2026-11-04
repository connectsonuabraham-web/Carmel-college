# Implementation Plan — WhatsApp Agent Dashboard

**Project:** Carmel College Voice Agent Dashboard  
**Root:** `c:\Users\LENOVO\Downloads\voice agent dashboard`  
**Stack:** React 18 + Vite + TypeScript (strict) + Tailwind CSS + React Query v5 + Recharts + Axios  
**Rule:** Do NOT change any existing Sarvam API calls, hooks, pages, or server routes.  
**Build command:** `npm run build` (= `tsc && vite build`)  
**Stop contract:** `c:\Users\LENOVO\Downloads\voice agent dashboard\.agents\tasks\review.json` with `{ "verdict": "APPROVED" | "CHANGES_REQUESTED", "findings": [...], "reviewDoc": "..." }`

---

## Key Conventions (from codebase exploration)

- **Axios clients:** `axios.create({ baseURL })` with 429-retry interceptor — see `src/api/sarvamClient.ts`
- **API functions:** named exports, `client.get(path)`, return `Promise<T>` — see `src/api/interactions.ts`
- **React Query hooks:** `useQuery({ queryKey, queryFn, refetchInterval: N, refetchIntervalInBackground: true, staleTime: 0, gcTime: 120000, retry: 2 })` — see `src/hooks/useInteractions.ts`
- **Cards:** `bg-white rounded-2xl border border-gray-100 shadow-card p-5`
- **Active nav:** `bg-green-500 text-white`; inactive: `text-gray-600 hover:bg-green-50 hover:text-green-700`
- **Theme:** outer `bg-[#e8f5e9]`, inner white `rounded-3xl`, accents `#4CAF50` / `green-500`
- **StatCard:** reuse `src/components/StatCard.tsx` for all KPI tiles
- **Charts:** recharts already installed (`LineChart`, `BarChart`, `PieChart`, `ResponsiveContainer`)
- **Icons:** lucide-react already installed

---

## FEAT-001 — Backend + Data Layer

- [ ] 1. **Add `SETSMART_CONFIG` to `src/config.ts`**  
      Append after the existing exports — do NOT modify `CONFIG` or `API_BASE_PATH`.  
      ```ts
      export const SETSMART_CONFIG = {
        BASE_URL: 'https://setsmart.io',
        API_KEY: '8444ca5e-654b-4a10-913f-4fc6485c2d7c',
        CLIENT_ID: 'sonuabraham0',
      } as const
      ```  
      Files: `src/config.ts`  
      Verify: file diff — CONFIG unchanged, SETSMART_CONFIG added.

- [ ] 2. **Append SetSmart vars to `.env`**  
      Add two lines at the end — do NOT remove any existing lines (`PORT`, `SARVAM_API_KEY`, etc.):  
      ```
      VITE_SETSMART_API_KEY=8444ca5e-654b-4a10-913f-4fc6485c2d7c
      VITE_SETSMART_CLIENT_ID=sonuabraham0
      ```  
      Files: `.env`  
      Verify: file shows original lines plus two new VITE_SETSMART_* lines.

- [ ] 3. **Add SetSmart proxy to `server.js`**  
      Insert the following block AFTER the `app.all('/api-proxy/*', ...)` line and BEFORE the `app.get('/api/health', ...)` line. The existing `/api/sarvam/*` route is unchanged — the new route is `/api/setsmart/*` (different prefix, no conflict):  
      ```js
      // ── SetSmart WhatsApp API proxy ──────────────────────────────────────────────
      app.all('/api/setsmart/*', async (req, res) => {
        const path = req.originalUrl.replace(/^\/api\/setsmart/, '');
        const sep  = path.includes('?') ? '&' : '?';
        const url  = `https://setsmart.io/api${path}${sep}clientId=sonuabraham0`;
        try {
          const upstream = await fetch(url, {
            method:  req.method,
            headers: {
              'x-api-key':    '8444ca5e-654b-4a10-913f-4fc6485c2d7c',
              'Content-Type': 'application/json',
            },
            body: ['GET', 'HEAD'].includes(req.method) ? undefined : JSON.stringify(req.body),
          });
          res.setHeader('Content-Type',              'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.status(upstream.status).send(await upstream.text());
        } catch (e) {
          res.status(502).json({ error: e.message });
        }
      });
      ```  
      Files: `server.js`  
      Verify: `npm run build` exits 0 (server.js is not compiled; the proxy is runtime-only).

- [ ] 4. **Create `src/types/setsmart.ts`**  
      New file — export three interfaces exactly as specified:  
      ```ts
      export interface SetSmartLead {
        id: string
        name: string
        phone: string
        status: 'Qualified' | 'Booked' | 'Open' | 'Not Interested' | 'New' | string
        lastMessage?: string
        lastActivity?: string
        aiEnabled?: boolean
        tags?: string[]
        notes?: string
        course?: string
        email?: string
      }

      export interface SetSmartConversation {
        id: string
        contactName: string
        phone: string
        lastMessage: string
        lastActivity: string
        status: string
        aiEnabled: boolean
        unreadCount?: number
      }

      export interface SetSmartUsage {
        totalConversations: number
        aiMessages: number
        humanMessages: number
        qualifiedLeads: number
        bookedSessions: number
        responseRate?: number
      }
      ```  
      Files: `src/types/setsmart.ts`  
      Verify: TypeScript parses it — `npm run build` exits 0 after adding.

- [ ] 5. **Create `src/api/setsmartClient.ts`**  
      Clone the pattern from `src/api/sarvamClient.ts` — axios instance + 429-retry interceptor:  
      ```ts
      import axios from 'axios'

      // Express server proxies /api/setsmart/* → https://setsmart.io/api/*
      // x-api-key and clientId are injected server-side — never exposed in the browser
      export const setsmartClient = axios.create({ baseURL: '/api/setsmart' })

      setsmartClient.interceptors.response.use(
        (res) => res,
        async (error) => {
          if (error.response?.status === 429) {
            const retryAfter = parseInt(error.response.headers['retry-after'] ?? '5', 10)
            await new Promise(r => setTimeout(r, retryAfter * 1000))
            return setsmartClient.request(error.config)
          }
          return Promise.reject(error)
        }
      )
      ```  
      Files: `src/api/setsmartClient.ts`  
      Verify: imports cleanly, `npm run build` exits 0.

- [ ] 6. **Create `src/api/setsmart.ts`**  
      Import `setsmartClient` and the three types from `src/types/setsmart.ts`. Export 8 fetch functions. For list endpoints handle both a raw array response and a `{ data: [...] }` envelope via `data.data ?? data`. For the usage endpoint, handle `data.data ?? data` similarly:  
      ```ts
      import { setsmartClient } from './setsmartClient'
      import { SetSmartLead, SetSmartConversation, SetSmartUsage } from '../types/setsmart'

      function unwrapList<T>(raw: unknown): T[] {
        if (Array.isArray(raw)) return raw as T[]
        const r = raw as Record<string, unknown>
        if (Array.isArray(r?.data)) return r.data as T[]
        return []
      }

      export async function fetchLeads(): Promise<SetSmartLead[]> {
        const { data } = await setsmartClient.get('/leads')
        return unwrapList<SetSmartLead>(data)
      }
      export async function fetchConversations(): Promise<SetSmartConversation[]> {
        const { data } = await setsmartClient.get('/conversations')
        return unwrapList<SetSmartConversation>(data)
      }
      export async function fetchAnsweredLeads(): Promise<SetSmartLead[]> {
        const { data } = await setsmartClient.get('/answered-leads')
        return unwrapList<SetSmartLead>(data)
      }
      export async function fetchOkCalls(): Promise<SetSmartLead[]> {
        const { data } = await setsmartClient.get('/ok-call')
        return unwrapList<SetSmartLead>(data)
      }
      export async function fetchResume(): Promise<SetSmartLead[]> {
        const { data } = await setsmartClient.get('/resume')
        return unwrapList<SetSmartLead>(data)
      }
      export async function fetchFailedMessages(): Promise<SetSmartLead[]> {
        const { data } = await setsmartClient.get('/failed-messages')
        return unwrapList<SetSmartLead>(data)
      }
      export async function fetchAiOff(): Promise<SetSmartLead[]> {
        const { data } = await setsmartClient.get('/ai-off')
        return unwrapList<SetSmartLead>(data)
      }
      export async function fetchAgencyUsage(): Promise<SetSmartUsage> {
        const { data } = await setsmartClient.get('/agency/usage')
        const raw = (data?.data ?? data) as SetSmartUsage
        return {
          totalConversations: raw?.totalConversations ?? 0,
          aiMessages:         raw?.aiMessages         ?? 0,
          humanMessages:      raw?.humanMessages       ?? 0,
          qualifiedLeads:     raw?.qualifiedLeads      ?? 0,
          bookedSessions:     raw?.bookedSessions      ?? 0,
          responseRate:       raw?.responseRate,
        }
      }
      ```  
      Files: `src/api/setsmart.ts`  
      Verify: `npm run build` exits 0.

- [ ] 7. **Create `src/hooks/useSetSmart.ts`**  
      Follow the exact pattern of `src/hooks/useInteractions.ts` — one exported hook per fetch function:  
      ```ts
      import { useQuery } from '@tanstack/react-query'
      import {
        fetchLeads, fetchConversations, fetchAnsweredLeads, fetchOkCalls,
        fetchResume, fetchFailedMessages, fetchAiOff, fetchAgencyUsage,
      } from '../api/setsmart'

      const OPTS = {
        refetchInterval: 30000,
        refetchIntervalInBackground: true,
        staleTime: 0,
        gcTime: 120000,
        retry: 2,
      } as const

      export function useLeads()          { return useQuery({ queryKey: ['setsmart-leads'],            queryFn: fetchLeads,            ...OPTS }) }
      export function useConversations()  { return useQuery({ queryKey: ['setsmart-conversations'],    queryFn: fetchConversations,    ...OPTS }) }
      export function useAnsweredLeads()  { return useQuery({ queryKey: ['setsmart-answered-leads'],   queryFn: fetchAnsweredLeads,    ...OPTS }) }
      export function useOkCalls()        { return useQuery({ queryKey: ['setsmart-ok-calls'],         queryFn: fetchOkCalls,          ...OPTS }) }
      export function useResume()         { return useQuery({ queryKey: ['setsmart-resume'],           queryFn: fetchResume,           ...OPTS }) }
      export function useFailedMessages() { return useQuery({ queryKey: ['setsmart-failed-messages'],  queryFn: fetchFailedMessages,   ...OPTS }) }
      export function useAiOff()          { return useQuery({ queryKey: ['setsmart-ai-off'],           queryFn: fetchAiOff,            ...OPTS }) }
      export function useAgencyUsage()    { return useQuery({ queryKey: ['setsmart-agency-usage'],     queryFn: fetchAgencyUsage,      ...OPTS }) }
      ```  
      Files: `src/hooks/useSetSmart.ts`  
      Verify: `npm run build` exits 0 — all FEAT-001 files compile cleanly.

---

## FEAT-002 — UI Layer (depends on FEAT-001)

- [ ] 8. **Create `src/pages/WhatsAppAgentPage.tsx`**  
      Match the WEBKONIC WhatsApp Agent Dashboard and Carmel College WhatsApp Agent Dashboard reference images exactly.  

      **Imports needed:** React, useState, useMemo, NavLink (react-router-dom), recharts (LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer), lucide-react (MessageCircle, Phone, Users, Zap, UserCheck, CalendarCheck2, Mail, Globe, Pause, Info), useLeads + useAgencyUsage + useAiOff from `../hooks/useSetSmart`, SetSmartLead from `../types/setsmart`.  

      **Structure:**
      ```
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">WhatsApp Agent</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage your WhatsApp connection, AI assistant and conversations.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50">
              Test Assistant
            </button>
            <button className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium">
              Save Changes
            </button>
          </div>
        </div>

        {/* Connection bar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-4 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <MessageCircle size={20} className="text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">WhatsApp Connected</span>
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Connected
                </span>
              </div>
              <p className="text-xs text-gray-500">Your WhatsApp Business account is active and synced.</p>
            </div>
          </div>
          {/* Phone / Business Name / Quality / Manage Connection — as flex items */}
          ...
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-200 gap-1">
          {['Overview','Conversations','Leads & CRM'].map(tab => (
            <button key={tab} onClick={()=>setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab===tab ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>{tab}</button>
          ))}
        </div>

        {/* Overview tab content */}
        {activeTab === 'Overview' && (
          <>
            {/* 3-column top row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* AI Assistant Status */}
              {/* Assistant Performance */}
              {/* Conversation Activity */}
            </div>
            {/* 3-column bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* WhatsApp Business Profile */}
              {/* Recent Conversations */}
              {/* AI Usage This Month */}
            </div>
          </>
        )}
      </div>
      ```

      **AI Assistant Status card detail:**
      - Toggle: `<button onClick={()=>setAiOn(!aiOn)} className={...}>` — green when on, gray when off. Use a styled pill toggle (w-12 h-6 rounded-full transition-colors relative; inner dot w-5 h-5 rounded-full bg-white absolute shadow).
      - Below toggle: green dot + 'Active' text when on.
      - 'Pause AI' button: `border border-gray-300 w-full rounded-lg py-2 text-sm flex items-center gap-2 justify-center`.
      - Info row: Info icon + italic small text.
      - `aiOffCount`: `{useAiOff().data?.length ?? 0} conversations with AI paused`.

      **Assistant Performance card detail:**
      - `const usage = useAgencyUsage().data`
      - 6 stat mini-tiles in `grid grid-cols-2 gap-3`:
        - Conversations: `usage?.totalConversations ?? 0`
        - AI messages: `usage?.aiMessages ?? 0`
        - Human messages: `usage?.humanMessages ?? 0`
        - Response rate: `usage?.totalConversations ? Math.round(((usage.aiMessages??0)/(usage.totalConversations))*100)+'%' : '—'`
        - Qualified leads: `usage?.qualifiedLeads ?? 0`
        - Booked counselling: `usage?.bookedSessions ?? 0`
      - Each tile: `bg-gray-50 rounded-xl p-3` with icon in `w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2`, then `<p className="text-xl font-bold text-gray-900">{value}</p>` and `<p className="text-xs text-gray-500">{label}</p>`.

      **Conversation Activity chart:**
      - Build data with useMemo from `useLeads().data`: group by lastActivity date; produce array of `{ date: string, count: number }` for days 1-30 of current month.
      - Render `<LineChart>` with `<Line type="monotone" dataKey="count" stroke="#4CAF50" strokeWidth={2} dot={false} />`.
      - Period selector: two buttons 'This Month' / 'Last Month' above chart, right-aligned.

      **Recent Conversations table:** columns Contact | Last Message | Last Activity | AI | Status; `useLeads().data?.slice(0,5) ?? []`; if empty show `<tr><td colSpan={5} className="text-center py-6 text-gray-400 text-sm">No data yet</td></tr>`.

      **AI Usage This Month:** two progress bars. `const aiPct = Math.min(Math.round(((usage?.aiMessages??0)/3000)*100), 100)`, `const humPct = Math.min(Math.round(((usage?.humanMessages??0)/500)*100), 100)`.

      Files: `src/pages/WhatsAppAgentPage.tsx`  
      Verify: `npm run build` exits 0.

- [ ] 9. **Create `src/pages/WhatsAppConversationsPage.tsx`**  
      Match the WEBKONIC WhatsApp Conversations Dashboard reference image exactly.  

      **Imports:** React, useState, useLeads from hooks, SetSmartLead from types, lucide-react (Search, Phone, Tag, MoreVertical, MessageCircle, UserCheck, Calendar, Check, FileText, PauseCircle, Send, Plus, Smile, Paperclip).

      **Layout:** `<div className="flex gap-4" style={{ height: 'calc(100vh - 160px)' }}>` — three flex children.

      **Left column (`w-80 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-card flex flex-col`):**
      - Header: `<div className="p-4 border-b border-gray-100"><h2 className="font-bold text-gray-900">Conversations</h2></div>`
      - Stats tabs row: `<div className="flex gap-1 px-3 pt-2 pb-1 flex-wrap text-xs">` — 4 tab pills: All (total count), Unread (leads with unreadCount > 0), AI (leads with aiEnabled), Human (leads without aiEnabled). Active pill: `bg-green-100 text-green-700 font-semibold rounded-full px-2 py-0.5`. Inactive: `text-gray-500 hover:bg-gray-100 rounded-full px-2 py-0.5 cursor-pointer`.
      - Search: `<div className="px-3 pb-2"><div className="relative"><Search size={14} ...absolute left-3 top-1/2.../> <input ...pl-8 .../></div></div>`
      - List (`overflow-y-auto flex-1 px-2`): for each filtered lead in `useLeads().data ?? []`:
        ```
        <div key={lead.id} onClick={()=>setSelected(lead)}
          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selected?.id===lead.id ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {lead.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
              <span className="font-medium text-sm text-gray-900 truncate">{lead.name}</span>
              <span className="text-[10px] text-gray-400 flex-shrink-0 ml-1">{lead.lastActivity ?? ''}</span>
            </div>
            <p className="text-xs text-gray-500 truncate">{lead.lastMessage ?? ''}</p>
            <div className="flex items-center gap-1 mt-1">
              {lead.aiEnabled
                ? <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">AI</span>
                : <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">Human</span>
              }
              {lead.status && <span className="text-[10px] bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded-full">{lead.status}</span>}
            </div>
          </div>
          {(lead.unreadCount ?? 0) > 0 && (
            <span className="w-5 h-5 bg-green-500 rounded-full text-white text-[10px] flex items-center justify-center flex-shrink-0">
              {lead.unreadCount}
            </span>
          )}
        </div>
        ```
      - Empty state: `<p className="text-sm text-gray-400 text-center py-8">No conversations yet</p>`

      **Middle column (`flex-1 bg-white rounded-2xl border border-gray-100 shadow-card flex flex-col min-w-0`):**
      - If no selected: `<div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3"><MessageCircle size={40} className="text-gray-200"/><p className="text-sm">Select a conversation to view messages</p></div>`
      - If selected:
        - Header (`flex items-center gap-3 p-4 border-b border-gray-100`): avatar circle, name + phone, status dropdown (`<select className="border border-gray-200 rounded-lg text-xs px-2 py-1">`), icon buttons (Phone, Tag, MoreVertical).
        - Chat area (`flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4`):
          - Date label: `<div className="text-center text-xs text-gray-400 bg-white rounded-full px-3 py-1 mx-auto w-fit">Today</div>`
          - User message bubble: `<div className="flex justify-start"><div className="bg-white rounded-2xl rounded-tl-none shadow-sm p-3 max-w-xs text-sm text-gray-800">{selected.lastMessage ?? 'Hello, I have an enquiry.'}<span className="block text-[10px] text-gray-400 mt-1 text-right">{selected.lastActivity}</span></div></div>`
          - AI response bubble: `<div className="flex justify-end"><div className="bg-green-50 rounded-2xl rounded-tr-none p-3 max-w-xs text-sm text-gray-800"><p className="text-[10px] font-semibold text-green-600 mb-1 flex items-center gap-1"><Zap size={10}/> AI Agent</p>Hello! Thank you for your enquiry. I'm here to help with information about Carmel College admissions, courses, eligibility, fees and counselling.<span className="block text-[10px] text-gray-400 mt-1 text-right">{selected.lastActivity}</span></div></div>`
        - Input bar (`flex items-center gap-2 p-3 border-t border-gray-100 bg-white`): Plus button circle, `<input className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none" placeholder="Type a message..." />`, Smile icon, Paperclip icon, `<button className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"><Send size={14} className="text-white ml-0.5"/></button>`.

      **Right column (`w-72 flex-shrink-0 bg-white rounded-2xl border border-gray-100 shadow-card flex flex-col overflow-hidden`):**
      - Tab bar (`flex border-b border-gray-100 flex-shrink-0`): Contact | Lead | Activity tabs. Active: `border-b-2 border-green-500 text-green-600 font-medium text-sm px-4 py-3`. Inactive: `text-gray-500 text-sm px-4 py-3 hover:text-gray-700`.
      - Content area (`overflow-y-auto flex-1 p-4`):
        - Contact tab: avatar circle (w-16 h-16 bg-green-500 mx-auto text-white text-2xl font-bold), name h3, divider, Phone row, MessageCircle row, email row if available.
        - Lead Status: label + `<select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1">` with options Qualified/Booked/Open/Not Interested/New.
        - Tags: pill list from `selected?.tags ?? ['BSc Nursing', '2026 Intake']`, each `bg-gray-100 text-gray-600 px-2 py-0.5 text-xs rounded-full`, plus '+ Add Tag' button.
        - Actions: 5 buttons (Pause AI, Assign to Human, Mark as Booked, Mark as Sold, Add Note) in `space-y-2`, each `w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-100 rounded-lg hover:bg-gray-50`.
        - Notes: label + '+ Add Note' right, notes text block `bg-gray-50 rounded-lg p-3 text-sm text-gray-600`.
      - If no selected lead: right column shows nothing special (can be empty or collapsed).

      Files: `src/pages/WhatsAppConversationsPage.tsx`  
      Verify: `npm run build` exits 0.

- [ ] 10. **Create `src/pages/WhatsAppLeadsPage.tsx`**  
       Match the Leads & CRM section from the reference images.  

       **Imports:** React, useState, useMemo, lucide-react (Search, Eye, BotOff, Pencil, CalendarCheck2, UserCheck), StatCard from `../components/StatCard`, useLeads + useOkCalls + useAnsweredLeads from `../hooks/useSetSmart`, SetSmartLead from `../types/setsmart`.

       **Status badge helper function inside the file:**
       ```ts
       function statusBadge(status: string) {
         const map: Record<string, string> = {
           Qualified:      'bg-green-100 text-green-700',
           Booked:         'bg-blue-100 text-blue-700',
           Open:           'bg-yellow-100 text-yellow-700',
           'Not Interested': 'bg-red-100 text-red-700',
           New:            'bg-gray-100 text-gray-600',
         }
         return map[status] ?? 'bg-gray-100 text-gray-600'
       }
       ```

       **Data merge (useMemo):**
       ```ts
       const allLeads = useMemo(() => {
         const map = new Map<string, SetSmartLead>()
         ;[...(leadsData ?? []), ...(answeredData ?? []), ...(okCallsData ?? [])].forEach(l => {
           if (l.id && !map.has(l.id)) map.set(l.id, l)
         })
         return Array.from(map.values())
       }, [leadsData, answeredData, okCallsData])
       ```

       **Filter + search client-side:**
       ```ts
       const filtered = useMemo(() => {
         let list = allLeads
         if (activeFilter !== 'All') list = list.filter(l => l.status === activeFilter)
         if (search.trim()) {
           const q = search.toLowerCase()
           list = list.filter(l =>
             l.name?.toLowerCase().includes(q) ||
             l.phone?.toLowerCase().includes(q) ||
             l.lastMessage?.toLowerCase().includes(q)
           )
         }
         return list
       }, [allLeads, activeFilter, search])
       ```

       **Table columns:** Contact | Last Message | Last Activity | AI Status | Lead Status | Actions  
       - Contact cell: `<td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{lead.name?.charAt(0)}</div><div><p className="font-medium text-sm">{lead.name}</p><p className="text-xs text-gray-400">{lead.phone}</p></div></div></td>`
       - Last Message: truncate at 50 chars
       - AI Status: green dot + 'On' or gray dot + 'Off'
       - Lead Status: badge pill with `statusBadge(lead.status)`
       - Actions: 4 icon buttons (Eye, BotOff/Zap, Pencil, CalendarCheck2), each `p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-green-600`
       - Loading: `<tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading leads…</td></tr>`
       - Empty: `<tr><td colSpan={6} className="text-center py-8 text-gray-400">No leads yet</td></tr>`

       Files: `src/pages/WhatsAppLeadsPage.tsx`  
       Verify: `npm run build` exits 0.

- [ ] 11. **Update `src/components/Layout.tsx` — sidebar nav**  
       Add `MessageCircle`, `MessagesSquare`, `Users` to the lucide-react imports (they are not currently imported).  
       Split the single `navItems` array into two named arrays and render them in two separate groups inside `SidebarContent`:

       ```ts
       const voiceItems = [
         { to: '/',           label: 'Dashboard',    icon: <LayoutDashboard size={18} /> },
         { to: '/live-calls', label: 'Live Calls',   icon: <Zap size={18} /> },
         { to: '/calls',      label: 'Voice Agent',  icon: <Phone size={18} /> },
         { to: '/attempts',   label: 'Attempts',     icon: <PhoneCall size={18} /> },
         { to: '/campaigns',  label: 'Campaigns',    icon: <Megaphone size={18} /> },
         { to: '/group-by',   label: 'Group By',     icon: <Layers size={18} /> },
         { to: '/analytics',  label: 'Analytics',    icon: <BarChart3 size={18} /> },
         { to: '/boards',     label: 'Boards',       icon: <LayoutGrid size={18} /> },
       ]

       const whatsappItems = [
         { to: '/whatsapp',               label: 'WhatsApp Agent', icon: <MessageCircle size={18} /> },
         { to: '/whatsapp/conversations', label: 'Conversations',  icon: <MessagesSquare size={18} /> },
         { to: '/whatsapp/leads',         label: 'Leads & CRM',   icon: <Users size={18} /> },
       ]
       ```

       In `SidebarContent`, replace the single `navItems.map(...)` block with:
       ```tsx
       <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Main Menu</p>
       <div className="space-y-0.5">
         {voiceItems.map(item => <NavLink ... />)}
       </div>
       <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mt-5 mb-2">WhatsApp</p>
       <div className="space-y-0.5">
         {whatsappItems.map(item => <NavLink ... />)}
       </div>
       ```
       Keep the `otherItems` ("Other" section with Settings) and user profile exactly as they are. Keep all header/topbar/mobile overlay JSX unchanged.  
       Files: `src/components/Layout.tsx`  
       Verify: `npm run build` exits 0 and sidebar shows both sections.

- [ ] 12. **Update `src/pages/OverviewPage.tsx` — WhatsApp KPIs + bottom section**  
       Read the file carefully first, then make exactly these additions — remove nothing:

       **Imports to add** (append to existing import line from lucide-react if present, or add a new import):
       - `MessageCircle` from `lucide-react` (check if already imported; if not add it)
       - `NavLink` from `react-router-dom`
       - `useAgencyUsage, useLeads` from `'../hooks/useSetSmart'`

       **Inside `OverviewPage()` function body** — add these two hooks after the existing hook calls:
       ```ts
       const { data: waUsage } = useAgencyUsage()
       const { data: waLeads } = useLeads()
       ```

       **KPI row 2** — change `grid-cols-2 sm:grid-cols-4` to `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6` and add two new StatCard entries after the existing four:
       ```tsx
       <StatCard title="WhatsApp Convos" value={waUsage?.totalConversations ?? 0} subtitle="this month" />
       <StatCard title="Qualified Leads"  value={waUsage?.qualifiedLeads      ?? 0} subtitle="WhatsApp" />
       ```

       **After the heatmap `</div>` block, before the page-closing `</div>`**, add:
       ```tsx
       {/* WhatsApp Recent Conversations */}
       <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
         <div className="flex items-center justify-between mb-4">
           <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
             <MessageCircle size={16} className="text-green-500" />
             Recent WhatsApp Conversations
           </h3>
           <NavLink
             to="/whatsapp/conversations"
             className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
           >
             View All →
           </NavLink>
         </div>
         {(waLeads?.length ?? 0) > 0 ? (
           <table className="w-full text-sm">
             <thead>
               <tr className="text-xs text-gray-400 border-b border-gray-100">
                 <th className="pb-2 text-left font-medium">Contact</th>
                 <th className="pb-2 text-left font-medium">Last Message</th>
                 <th className="pb-2 text-left font-medium">AI</th>
                 <th className="pb-2 text-left font-medium">Status</th>
               </tr>
             </thead>
             <tbody>
               {waLeads.slice(0, 3).map(lead => (
                 <tr key={lead.id} className="border-b border-gray-50 last:border-0">
                   <td className="py-3">
                     <div className="flex items-center gap-2">
                       <div className="w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                         {lead.name?.charAt(0) ?? '?'}
                       </div>
                       <span className="font-medium">{lead.name}</span>
                     </div>
                   </td>
                   <td className="py-3 text-gray-500 max-w-[200px] truncate">{lead.lastMessage ?? '—'}</td>
                   <td className="py-3">
                     {lead.aiEnabled
                       ? <span className="flex items-center gap-1 text-xs text-green-600"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"/>On</span>
                       : <span className="flex items-center gap-1 text-xs text-gray-400"><span className="w-1.5 h-1.5 bg-gray-300 rounded-full"/>Off</span>
                     }
                   </td>
                   <td className="py-3">
                     <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                       lead.status === 'Qualified' ? 'bg-green-100 text-green-700' :
                       lead.status === 'Booked'    ? 'bg-blue-100 text-blue-700'   :
                       lead.status === 'Open'      ? 'bg-yellow-100 text-yellow-700' :
                       'bg-gray-100 text-gray-600'
                     }`}>{lead.status}</span>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         ) : (
           <p className="text-sm text-gray-400 text-center py-6">No WhatsApp data yet</p>
         )}
       </div>
       ```

       Files: `src/pages/OverviewPage.tsx`  
       Verify: `npm run build` exits 0 and OverviewPage still compiles with all existing code intact.

- [ ] 13. **Update `src/App.tsx` — add three new routes**  
       Add three import lines after the existing page imports:
       ```ts
       import { WhatsAppAgentPage }         from './pages/WhatsAppAgentPage'
       import { WhatsAppConversationsPage } from './pages/WhatsAppConversationsPage'
       import { WhatsAppLeadsPage }         from './pages/WhatsAppLeadsPage'
       ```
       Inside the `<Route path="/" element={<Layout />}>` block, add three new `<Route>` entries after the existing ones (before the closing `</Route>`):
       ```tsx
       <Route path="whatsapp"               element={<WhatsAppAgentPage />} />
       <Route path="whatsapp/conversations" element={<WhatsAppConversationsPage />} />
       <Route path="whatsapp/leads"         element={<WhatsAppLeadsPage />} />
       ```
       Do NOT change any existing routes.  
       Files: `src/App.tsx`  
       Verify: `npm run build` exits 0. Confirm App.tsx contains all three new path strings.

- [ ] 14. **Final build verification**  
       Run `npm run build` from `c:\Users\LENOVO\Downloads\voice agent dashboard`.  
       Expected: TypeScript type-check passes (tsc exits 0), Vite bundle completes, `dist/` folder produced.  
       If any TS errors appear, fix them before marking complete.  
       Files: all modified files  
       Verify: `npm run build` exits 0 with zero errors.

---

## Implementation Notes

1. **`/api/setsmart/*` vs `/api/sarvam/*` conflict:** There is no conflict — these are different URL prefixes on the Express router. The existing `sarvamFetchProxy` function is mounted at `/api/sarvam/*`; the new SetSmart proxy is mounted at `/api/setsmart/*`.

2. **TypeScript strict mode:** `tsconfig.json` has `"strict": true`. All hook return values must be typed with optional chaining (`data?.field ?? fallback`). Never use `any` — use `unknown` and narrow when needed.

3. **`gcTime` vs `cacheTime`:** The project uses React Query v5 (`@tanstack/react-query: ^5.62.7`) where the option is `gcTime` (not `cacheTime`). Use `gcTime: 120000`.

4. **Recharts imports:** All recharts components are available — `LineChart`, `Line`, `BarChart`, `Bar`, `PieChart`, `Pie`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `ResponsiveContainer`, `Cell` are already used in existing pages.

5. **`shadow-card` class:** defined in `tailwind.config.js` as `'0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)'` — use it on all new cards.

6. **Empty-state rule:** Every list/table must show a 'No data yet' / 'No leads yet' centered message when the API returns an empty array. Never crash on `undefined`.

7. **Existing code:** `src/hooks/useWebhookStream.ts` also exports a `WebhookCall` interface. This is a different type from the one in `src/types/index.ts`. The new SetSmart types go in `src/types/setsmart.ts` — no naming conflict.
