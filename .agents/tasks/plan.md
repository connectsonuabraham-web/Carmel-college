# Implementation Plan — WhatsApp Agent Dashboard (Revision 2)

**Project:** Carmel College Voice Agent Dashboard  
**Root:** `c:\Users\LENOVO\Downloads\voice agent dashboard`  
**Stack:** React 18 + Vite + TypeScript (strict) + Tailwind CSS + React Query v5 + Recharts  
**Build command:** `npm run build` (= `tsc && vite build`)  
**Constraint:** Do NOT change any existing Sarvam API calls, hooks, Sarvam pages, or server routes. Keep all existing routes in `App.tsx`.  
**Key note:** `server.js` already has the `/api/setsmart/*` proxy mounted — do NOT add it again.

---

## Key Conventions (from codebase exploration)

- **setsmartFetch / setsmartPost:** already in `src/api/setsmartClient.ts` — plain `fetch` wrappers that hit `/api/setsmart/*`. Use these, not axios.
- **React Query hooks:** use `useQuery({ queryKey, queryFn, refetchInterval: 30000, staleTime: 0, retry: 1 })` — match the existing `OPT` pattern in `src/hooks/useSetSmart.ts`.
- **Cards:** `bg-white rounded-2xl border border-gray-100 shadow-sm p-5`
- **Active nav:** `bg-green-500 text-white`; inactive: `text-gray-600 hover:bg-green-50 hover:text-green-700`
- **Theme:** green-500 accent, outer `bg-[#e8f5e9]`, inner white `rounded-3xl`
- **Icons:** lucide-react already installed at `^0.468.0`
- **TypeScript:** strict mode, `noUnusedLocals: false`, `noUnusedParameters: false` — no `any`, use proper types with fallbacks.
- **React Query mutations:** use `useMutation` from `@tanstack/react-query` for POST actions.
- **Real API shape for /export-conversations:** returns `{ success, total, page, limit, has_more, conversations[] }`.
- **Real API shape for /leads:** returns array of lead objects directly.
- **404 endpoints (DO NOT CALL):** `/answered-leads`, `/failed-messages`, `/conversations`, `/agency/usage`, `/turn-on-ai`, `/turn-off-ai`.
- **The assistant_id:** `asst_hqrN2ycoPOmNKG4kdG16IhsmV3wX03nt`

---

## Item 1 — Rewrite `src/types/setsmart.ts` with accurate API shapes

Replace the current loose/optional-everything types with precise interfaces matching the real SetSmart API responses documented in the task brief.

**What to do:** Overwrite `src/types/setsmart.ts` entirely with these interfaces:

```ts
// Real lead shape from GET /api/setsmart/leads
export interface SetSmartLead {
  contact_id: string
  number: string
  name: string
  email: string
  status: string
  step: string
  tags: string[]
  custom_fields: Record<string, unknown>
  assistant_id: string
  qualified: boolean
  ok_call: string       // 'N/A' means not booked; any other value means booked
  booked_call: string
  answered: boolean
  situation: string
  objective: string
  importedAt: string
}

// Real message shape inside each conversation
export interface ConversationMessage {
  role: 'user' | 'assistant' | string
  content: string
  timestamp: string
  type: string
  sent_by: string
}

// Real contact inside a conversation
export interface ConversationContact {
  name: string
  email: string
  phone: string
}

// Real qualification inside a conversation
export interface ConversationQualification {
  qualified: boolean
  ok_call: string
  answered: boolean
  booked: boolean
  status: string
}

// Real conversation shape from GET /api/setsmart/export-conversations
export interface SetSmartConversation {
  id: string
  channel: string
  contact: ConversationContact
  qualification: ConversationQualification
  tags: string[]
  notes: string
  custom_fields: Record<string, unknown>
  assistant_id: string
  message_count: number
  messages: ConversationMessage[]
  updated_at: string
}

// Paginated wrapper returned by fetchConversations()
export interface ConversationsResponse {
  success: boolean
  total: number
  page: number
  limit: number
  has_more: boolean
  conversations: SetSmartConversation[]
}

// Legacy type kept for backwards-compat with WhatsAppLeadsPage and any other existing usage
// (maps to SetSmartLead loosely — keep fields as optional so existing code does not break)
export interface SetSmartUsage {
  totalConversations?: number
  conversations?: number
  aiMessages?: number
  humanMessages?: number
  qualifiedLeads?: number
  bookedSessions?: number
  responseRate?: number
}
```

**Files:** `src/types/setsmart.ts`  
**Verify:** `npm run build` — TypeScript compiles with zero errors. If any existing file imports from `src/types/setsmart.ts` and breaks, fix those import sites in the same step.

---

## Item 2 — Rewrite `src/api/setsmart.ts` with typed functions for working endpoints only

Replace the entire file. Remove all calls to 404 endpoints (`/answered-leads`, `/failed-messages`, `/conversations`, `/agency/usage`). Add typed mutation functions for action endpoints.

**What to do:** Overwrite `src/api/setsmart.ts` with:

```ts
import { setsmartFetch, setsmartPost } from './setsmartClient'
import type {
  SetSmartLead,
  SetSmartConversation,
  ConversationsResponse,
} from '../types/setsmart'

// ── GET endpoints (working) ──────────────────────────────────────────────────

export async function fetchLeads(): Promise<SetSmartLead[]> {
  const data = await setsmartFetch('/leads')
  return Array.isArray(data) ? (data as SetSmartLead[]) : []
}

export async function fetchConversations(): Promise<ConversationsResponse> {
  const data = await setsmartFetch('/export-conversations')
  const d = data as Record<string, unknown>
  return {
    success:       (d?.success as boolean)    ?? false,
    total:         (d?.total as number)        ?? 0,
    page:          (d?.page as number)         ?? 1,
    limit:         (d?.limit as number)        ?? 50,
    has_more:      (d?.has_more as boolean)    ?? false,
    conversations: Array.isArray(d?.conversations)
      ? (d.conversations as SetSmartConversation[])
      : [],
  }
}

export async function fetchResume(): Promise<SetSmartLead[]> {
  const data = await setsmartFetch('/resume')
  return Array.isArray(data) ? (data as SetSmartLead[]) : []
}

export async function fetchOkCall(): Promise<SetSmartLead[]> {
  const data = await setsmartFetch('/ok-call')
  return Array.isArray(data) ? (data as SetSmartLead[]) : []
}

export async function fetchAiOff(): Promise<SetSmartLead[]> {
  const data = await setsmartFetch('/ai-off')
  return Array.isArray(data) ? (data as SetSmartLead[]) : []
}

// ── POST mutation endpoints (working) ────────────────────────────────────────

export async function postSetBooked(contactId: string): Promise<unknown> {
  return setsmartPost('/set-booked', { contact_id: contactId })
}

export async function postSetSold(contactId: string): Promise<unknown> {
  return setsmartPost('/set-sold', { contact_id: contactId })
}

export async function postAddNotes(contactId: string, notes: string): Promise<unknown> {
  return setsmartPost('/add-notes', { contact_id: contactId, notes })
}

export async function postSendTemplate(contactId: string, templateId: string): Promise<unknown> {
  return setsmartPost('/send-template', { contact_id: contactId, template_id: templateId })
}

export async function postUpdateCustomFields(
  contactId: string,
  fields: Record<string, unknown>
): Promise<unknown> {
  return setsmartPost('/update-custom-fields', { contact_id: contactId, ...fields })
}

// ── Legacy re-exports — keep these so WhatsAppLeadsPage and any other
//    existing file that imports from this module does not break ─────────────

/** @deprecated use fetchLeads() */
export const fetchSetSmartLeads          = fetchLeads
/** @deprecated use fetchOkCall() */
export const fetchSetSmartOkCalls        = fetchOkCall
/** @deprecated use fetchAiOff() */
export const fetchSetSmartAiOff          = fetchAiOff
/** @deprecated use fetchResume() */
export const fetchSetSmartResume         = fetchResume
```

**Files:** `src/api/setsmart.ts`  
**Verify:** `npm run build` exits 0.

---

## Item 3 — Rewrite `src/hooks/useSetSmart.ts` with new hooks and legacy aliases

Replace the entire file. The new hooks use the new fetch functions. Legacy export names are preserved so `WhatsAppAgentPage`, `WhatsAppLeadsPage`, and `OverviewPage` which still import old names continue to compile.

**What to do:** Overwrite `src/hooks/useSetSmart.ts` with:

```ts
import { useQuery } from '@tanstack/react-query'
import {
  fetchLeads,
  fetchConversations,
  fetchResume,
  fetchOkCall,
  fetchAiOff,
} from '../api/setsmart'
import type { ConversationsResponse, SetSmartLead } from '../types/setsmart'

const OPT = { refetchInterval: 30000, staleTime: 0, retry: 1 } as const

// ── New canonical hooks ───────────────────────────────────────────────────────

/** Returns SetSmartLead[] */
export const useLeads = () =>
  useQuery<SetSmartLead[]>({ queryKey: ['ss-leads'], queryFn: fetchLeads, ...OPT })

/** Returns full ConversationsResponse: { total, conversations[], ... } */
export const useConversations = () =>
  useQuery<ConversationsResponse>({
    queryKey: ['ss-conversations'],
    queryFn: fetchConversations,
    ...OPT,
  })

export const useResume = () =>
  useQuery<SetSmartLead[]>({ queryKey: ['ss-resume'], queryFn: fetchResume, ...OPT })

export const useOkCall = () =>
  useQuery<SetSmartLead[]>({ queryKey: ['ss-ok-call'], queryFn: fetchOkCall, ...OPT })

export const useAiOff = () =>
  useQuery<SetSmartLead[]>({ queryKey: ['ss-aioff'], queryFn: fetchAiOff, ...OPT })

// ── Legacy aliases — kept for backwards compatibility ─────────────────────────
// WhatsAppLeadsPage uses: useSetSmartLeads, useSetSmartOkCalls, useSetSmartAnswered
// WhatsAppAgentPage uses: useSetSmartLeads, useSetSmartUsage, useSetSmartAiOff
// OverviewPage uses:      useSetSmartLeads, useSetSmartUsage

/** @deprecated use useLeads() */
export const useSetSmartLeads = useLeads

/** @deprecated use useOkCall() */
export const useSetSmartOkCalls = useOkCall

/** @deprecated use useAiOff() */
export const useSetSmartAiOff = useAiOff

/** @deprecated use useResume() */
export const useSetSmartResume = useResume

/**
 * @deprecated useSetSmartAnswered previously called /answered-leads which is 404.
 * Returns empty array to not break WhatsAppLeadsPage which imports this.
 */
export const useSetSmartAnswered = () =>
  useQuery<SetSmartLead[]>({
    queryKey: ['ss-answered-noop'],
    queryFn: async () => [],
    staleTime: Infinity,
    retry: 0,
  })

/**
 * @deprecated useSetSmartUsage previously called /agency/usage which is 404.
 * Returns empty object so OverviewPage/WhatsAppAgentPage degrade gracefully.
 */
export const useSetSmartUsage = () =>
  useQuery({
    queryKey: ['ss-usage-noop'],
    queryFn: async () => ({}),
    staleTime: Infinity,
    retry: 0,
  })

/**
 * @deprecated useSetSmartConversations returns just the array (not the full response).
 * Use useConversations() for the full ConversationsResponse.
 */
export const useSetSmartConversations = () => {
  const q = useConversations()
  return { ...q, data: q.data?.conversations ?? [] }
}

/**
 * @deprecated useSetSmartFailed previously called /failed-messages which is 404.
 */
export const useSetSmartFailed = () =>
  useQuery<SetSmartLead[]>({
    queryKey: ['ss-failed-noop'],
    queryFn: async () => [],
    staleTime: Infinity,
    retry: 0,
  })
```

**Files:** `src/hooks/useSetSmart.ts`  
**Verify:** `npm run build` exits 0. Existing pages (`WhatsAppLeadsPage`, `WhatsAppAgentPage`, `OverviewPage`) still compile because their imports resolve to the legacy aliases.

---

## Item 4 — Update `src/components/Layout.tsx` — restructure sidebar to 7+1 nav items

Restructure the sidebar navigation to exactly the 7 specified items in Main Menu plus Settings under Other. Keep all non-nav JSX (header, mobile overlay, user profile, refresh logic, SSE badge) unchanged.

**What to do:**

1. Update the lucide-react import to include `MessagesSquare`, `FileText`, `Bot`. Remove `PhoneCall`, `BarChart3`, `Megaphone`, `Layers`, `LayoutGrid` from the import if they are no longer used in navItems (check carefully — if used elsewhere in the file keep them).

2. Replace the `navItems` and `otherItems` arrays with:

```ts
const navItems = [
  { to: '/',                       label: 'Overview',       icon: <LayoutDashboard size={18} /> },
  { to: '/calls',                  label: 'Voice Agents',   icon: <Phone size={18} /> },
  { to: '/whatsapp',               label: 'WhatsApp Agent', icon: <MessageCircle size={18} /> },
  { to: '/whatsapp/conversations', label: 'Conversations',  icon: <MessagesSquare size={18} /> },
  { to: '/templates',              label: 'Templates',      icon: <FileText size={18} /> },
  { to: '/campaigns-wa',           label: 'Campaigns',      icon: <Megaphone size={18} /> },
  { to: '/ai-assistant',           label: 'AI Assistant',   icon: <Bot size={18} /> },
]

const otherItems = [
  { to: '/settings', label: 'Settings', icon: <Settings size={18} /> },
]
```

3. The `SidebarContent` function renders `navItems` under "Main Menu" and `otherItems` under "Other" — this structure is already in place; only the array contents change.

4. Update the lucide-react import line to include: `LayoutDashboard, Phone, MessageCircle, MessagesSquare, FileText, Megaphone, Bot, Settings, Menu, Bell, GraduationCap, RefreshCw, Radio, Download, LogOut` — and whatever else is used in the JSX (check the header/topbar for `Zap`, `PhoneCall`, `BarChart3` usage — these can be removed from import if only used in nav arrays).

**Files:** `src/components/Layout.tsx`  
**Verify:** `npm run build` exits 0. No "unused import" warnings should cause errors (tsconfig has `noUnusedLocals: false`).

---

## Item 5 — Update `src/App.tsx` — add 3 new routes, keep all existing routes

Add imports and route entries for the three new pages. All existing routes remain untouched.

**What to do:**

1. Add three import lines after the last existing page import:
```ts
import { TemplatesPage }    from './pages/TemplatesPage'
import { CampaignsWAPage }  from './pages/CampaignsWAPage'
import { AIAssistantPage }  from './pages/AIAssistantPage'
```

2. Inside the `<Route path="/" element={<Layout />}>` block, add three new routes after the existing `whatsapp/leads` route:
```tsx
<Route path="templates"     element={<TemplatesPage />} />
<Route path="campaigns-wa"  element={<CampaignsWAPage />} />
<Route path="ai-assistant"  element={<AIAssistantPage />} />
```

**Files:** `src/App.tsx`  
**Verify:** `npm run build` exits 0 after the three page files are created (Items 7, 8, 9).

---

## Item 6 — Rewrite `src/pages/WhatsAppAgentPage.tsx` with real data

Replace the placeholder stat calculations (which used the now-404 `/agency/usage` endpoint) with calculations derived from the real `useLeads()` and `useConversations()` hooks.

**What to do:** Overwrite `src/pages/WhatsAppAgentPage.tsx`.

**Data layer at top of component:**
```ts
const { data: leads = [] }  = useLeads()
const { data: convData }    = useConversations()
const { data: aiOff = [] }  = useAiOff()

const conversations     = convData?.conversations ?? []
const totalConversations = convData?.total ?? 0
const totalLeads         = leads.length
const bookedLeads        = leads.filter(l => l.ok_call !== 'N/A').length
const aiActive           = leads.length - aiOff.length
const totalMessages      = conversations.reduce((s, c) => s + (c.message_count ?? 0), 0)
const assistantId        = leads[0]?.assistant_id ?? 'asst_hqrN2ycoPOmNKG4kdG16IhsmV3wX03nt'
```

**Stats to show** (in the "Assistant Performance" card):
- Total conversations: `totalConversations`
- Total leads: `totalLeads`
- Booked leads: `bookedLeads`
- AI Active: `aiActive`
- Total messages: `totalMessages`
- Assistant ID (truncated): `assistantId.slice(0, 20)}...`

**AI toggle section:** The AI toggle is informational only — DO NOT call `/turn-on-ai` or `/turn-off-ai`. Show a note: *"AI control per conversation is available in the Conversations section."*

**Recent conversations list:** Use `conversations.slice(0, 5)`. For each, show `c.contact.name`, `c.contact.phone`, last message from `c.messages[c.messages.length-1]?.content ?? ''`, `c.qualification.status`.

**Preserve the full visual layout** of the existing page (header, connection bar, tabs, 3-column grid cards, chart area). Only replace the data calculations. The chart can still use mock/derived data from leads.

**Imports needed:** `useLeads`, `useConversations`, `useAiOff` from `../hooks/useSetSmart`; `SetSmartLead`, `SetSmartConversation` from `../types/setsmart`. Remove imports of `useSetSmartLeads`, `useSetSmartUsage`, `useSetSmartAiOff` and the old `SetSmartLead` usage that relied on the old type shape.

**Files:** `src/pages/WhatsAppAgentPage.tsx`  
**Verify:** `npm run build` exits 0.

---

## Item 7 — Rewrite `src/pages/WhatsAppConversationsPage.tsx` — full 3-column messenger

Replace the mock-data, leads-based implementation with a real messenger that uses `useConversations()` for real conversation data including messages.

**What to do:** Overwrite `src/pages/WhatsAppConversationsPage.tsx`.

**Imports:**
```ts
import React, { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Phone, Tag, MoreVertical, Send, Paperclip, Smile,
         User, Bot, CheckCircle2, DollarSign, StickyNote, X } from 'lucide-react'
import { useConversations } from '../hooks/useSetSmart'
import { postSetBooked, postSetSold, postAddNotes } from '../api/setsmart'
import type { SetSmartConversation, ConversationMessage } from '../types/setsmart'
```

**Layout:** `<div className="flex h-[calc(100vh-120px)] gap-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">`

**Left column — conversation list:**
- `const { data: convData, isFetching } = useConversations()`
- `const conversations = convData?.conversations ?? []`
- Search input: filters by `c.contact.name` or `c.contact.phone`
- Filter tabs: `All` | `Answered` (where `c.qualification.answered === true`) | `Booked` (where `c.qualification.booked === true`) | `AI Off` (not applicable to conversations directly — show all)
- Each list item shows: `c.contact.name`, last message preview (`c.messages[c.messages.length-1]?.content.slice(0,40)` or `''`), `c.updated_at` (format as relative time or short date), `c.message_count` badge, `c.qualification.status`
- Selected conversation: highlight with `bg-green-50`
- Auto-select first conversation on load: `const selected = selectedId ? conversations.find(c => c.id === selectedId) : conversations[0] ?? null`

**Middle column — message thread:**
- For the selected conversation, render `selected.messages` array
- `role === 'user'` → right-aligned blue bubble: `bg-blue-600 text-white rounded-2xl rounded-tr-sm`
- `role === 'assistant'` → left-aligned green bubble: `bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm shadow-sm`
- Show `msg.timestamp` below each bubble (format `new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})`)
- Show `msg.sent_by` as small label above content for assistant messages
- **Action buttons** below the message list (above the input bar), in a `flex gap-2 px-4 py-2 border-t border-gray-100 bg-gray-50`:
  - "Mark Booked" button → calls `postSetBooked(selected.id)` via `useMutation`. Disable if already booked (`selected.qualification.booked === true`). Show success/error toast state.
  - "Mark Sold" button → calls `postSetSold(selected.id)` via `useMutation`.
- Input bar: read-only note "Message sending available in SetSmart dashboard" (do not implement a send action — the API for sending is not listed as working)

**Right column — contact info:**
- `c.contact.name`, `c.contact.email`, `c.contact.phone`
- Qualification section: `qualified`, `ok_call`, `answered`, `booked`, `status` — display as labeled rows
- Tags: `c.tags.map(tag => <span>)` 
- Notes: `c.notes` displayed in a textarea-style read-only block
- "Add Note" button → opens inline textarea, on submit calls `postAddNotes(selected.id, noteText)` via `useMutation`, invalidates `['ss-conversations']` query on success

**Mutations pattern:**
```ts
const queryClient = useQueryClient()
const bookedMutation = useMutation({
  mutationFn: (id: string) => postSetBooked(id),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ss-conversations'] }),
})
```

**Files:** `src/pages/WhatsAppConversationsPage.tsx`  
**Verify:** `npm run build` exits 0.

---

## Item 8 — Create `src/pages/TemplatesPage.tsx`

Simple honest "not available" state with a link to setsmart.io.

**What to do:** Create new file:

```tsx
import React from 'react'
import { FileText, ExternalLink } from 'lucide-react'

export function TemplatesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
        <p className="text-sm text-gray-500 mt-0.5">WhatsApp message templates</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
          <FileText size={32} className="text-green-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Templates not available via API</h2>
        <p className="text-sm text-gray-500 max-w-md mb-6">
          WhatsApp message templates are managed directly in the SetSmart dashboard.
          The SetSmart API does not expose a templates endpoint for this dashboard to consume.
        </p>
        <a
          href="https://setsmart.io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
        >
          <ExternalLink size={15} />
          Manage Templates on SetSmart
        </a>
        <p className="text-xs text-gray-400 mt-4">
          Go to SetSmart → Templates to create and manage your WhatsApp message templates.
        </p>
      </div>
    </div>
  )
}
```

**Files:** `src/pages/TemplatesPage.tsx`  
**Verify:** `npm run build` exits 0.

---

## Item 9 — Create `src/pages/CampaignsWAPage.tsx`

Simple honest "not available" state with a link to setsmart.io.

**What to do:** Create new file:

```tsx
import React from 'react'
import { Megaphone, ExternalLink } from 'lucide-react'

export function CampaignsWAPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">WhatsApp Campaigns</h1>
        <p className="text-sm text-gray-500 mt-0.5">Broadcast campaigns via WhatsApp</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
          <Megaphone size={32} className="text-green-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Campaigns not available via API</h2>
        <p className="text-sm text-gray-500 max-w-md mb-6">
          WhatsApp broadcast campaigns are managed directly in the SetSmart dashboard.
          The SetSmart API does not expose a campaigns management endpoint for this dashboard.
        </p>
        <a
          href="https://setsmart.io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
        >
          <ExternalLink size={15} />
          Manage Campaigns on SetSmart
        </a>
        <p className="text-xs text-gray-400 mt-4">
          Go to SetSmart → Campaigns to create and send WhatsApp broadcast messages to your leads.
        </p>
      </div>
    </div>
  )
}
```

**Files:** `src/pages/CampaignsWAPage.tsx`  
**Verify:** `npm run build` exits 0.

---

## Item 10 — Create `src/pages/AIAssistantPage.tsx`

Show assistant_id from leads, conversation count, and an honest note about SetSmart dashboard management.

**What to do:** Create new file:

```tsx
import React from 'react'
import { Bot, ExternalLink, MessageCircle, Users, Info, BookOpen } from 'lucide-react'
import { useLeads, useConversations } from '../hooks/useSetSmart'

const ASSISTANT_ID = 'asst_hqrN2ycoPOmNKG4kdG16IhsmV3wX03nt'

export function AIAssistantPage() {
  const { data: leads = [] }  = useLeads()
  const { data: convData }    = useConversations()

  const totalConversations = convData?.total ?? 0
  const assistantId = leads[0]?.assistant_id ?? ASSISTANT_ID

  const stats = [
    { label: 'Assistant ID',       value: assistantId.slice(0, 24) + '…', icon: <Bot size={18} className="text-green-500" /> },
    { label: 'Total Leads',        value: leads.length,                    icon: <Users size={18} className="text-green-500" /> },
    { label: 'Conversations',      value: totalConversations,              icon: <MessageCircle size={18} className="text-green-500" /> },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your SetSmart WhatsApp AI assistant overview</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              {s.icon}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">{s.label}</p>
              <p className="font-mono text-sm font-semibold text-gray-900 truncate">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Bot size={16} className="text-green-500" /> Assistant Details
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-1">Full Assistant ID</p>
              <p className="font-mono text-xs bg-gray-50 rounded-lg px-3 py-2 text-gray-800 select-all break-all">
                {assistantId}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Channel</p>
              <p className="text-sm text-gray-800">WhatsApp</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Status</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Active
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Info size={16} className="text-green-500" /> AI Control
          </h3>
          <div className="space-y-3">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-sm font-medium text-blue-900 mb-1">Per-conversation AI toggle</p>
              <p className="text-xs text-blue-700">
                AI control per conversation is available in the Conversations section.
                Open any conversation and use the action buttons to pause or resume AI for that contact.
              </p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <p className="text-sm font-medium text-amber-900 mb-1">Global AI settings</p>
              <p className="text-xs text-amber-700">
                Global AI configuration (prompts, knowledge base, follow-up sequences) is managed
                in the SetSmart dashboard. The API does not expose these settings for editing here.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SetSmart link */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
          <BookOpen size={24} className="text-green-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">Manage AI in SetSmart</h3>
          <p className="text-xs text-gray-500 mt-1">
            Edit assistant prompts, knowledge base, templates, and follow-up sequences directly in SetSmart.
          </p>
        </div>
        <a
          href="https://setsmart.io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors flex-shrink-0"
        >
          <ExternalLink size={15} />
          Open SetSmart
        </a>
      </div>
    </div>
  )
}
```

**Files:** `src/pages/AIAssistantPage.tsx`  
**Verify:** `npm run build` exits 0.

---

## Item 11 — Update `src/pages/OverviewPage.tsx` — WhatsAppQuickSection with real data

The `WhatsAppQuickSection` component inside `OverviewPage.tsx` currently uses `useSetSmartLeads()` + `useSetSmartUsage()` — `useSetSmartUsage()` now returns `{}` because `/agency/usage` is 404. Replace it with real calculations from `useLeads()` + `useConversations()`.

**What to do:**

1. Add new imports at the top (after existing imports):
```ts
import { useLeads, useConversations } from '../hooks/useSetSmart'
import type { SetSmartConversation } from '../types/setsmart'
```
(Remove `useSetSmartLeads`, `useSetSmartUsage`, `SetSmartUsage` imports from the setsmart section if present — but only if they are exclusively used in `WhatsAppQuickSection`; if they appear elsewhere in the file keep them.)

2. **Rewrite `WhatsAppQuickSection`** (it is a sub-component defined inside `OverviewPage.tsx`):

```tsx
function WhatsAppQuickSection() {
  const { data: leads = [] }  = useLeads()
  const { data: convData }    = useConversations()

  const conversations      = convData?.conversations ?? []
  const totalConversations = convData?.total ?? 0
  const totalMessages      = conversations.reduce((s: number, c: SetSmartConversation) => s + (c.message_count ?? 0), 0)
  const bookedLeads        = leads.filter(l => l.ok_call !== 'N/A').length
  const aiActive           = leads.filter(l => !convData?.conversations.some(
    c => c.contact.phone === l.number && c.qualification.status === 'ai_off'
  )).length

  // Show section only when there is some real data to display
  if (leads.length === 0 && totalConversations === 0) return null

  const recent = conversations.slice(0, 3)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <MessageCircle size={15} className="text-green-500" /> Recent WhatsApp Conversations
          </h3>
          <a href="/whatsapp/conversations" className="text-xs text-green-600 hover:underline">View All →</a>
        </div>
        {recent.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No WhatsApp conversations yet</p>
        ) : (
          <div className="space-y-3">
            {recent.map((conv: SetSmartConversation, i: number) => {
              const lastMsg = conv.messages[conv.messages.length - 1]
              const statusMap: Record<string, string> = {
                Qualified: 'bg-green-100 text-green-700',
                Booked:    'bg-blue-100 text-blue-700',
                Open:      'bg-gray-100 text-gray-600',
                New:       'bg-yellow-100 text-yellow-700',
              }
              const status = conv.qualification.status
              return (
                <div key={i} className="flex items-center gap-3 py-1">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-700 text-[10px] font-bold">
                      {(conv.contact.name || '?').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{conv.contact.name || conv.contact.phone}</p>
                    <p className="text-[10px] text-gray-400 truncate">{lastMsg?.content ?? '—'}</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusMap[status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {status}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 size={15} className="text-green-500" /> WhatsApp Summary
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-2xl font-bold text-gray-900">{totalConversations}</p><p className="text-xs text-gray-400">Total Conversations</p></div>
          <div><p className="text-2xl font-bold text-gray-900">{totalMessages}</p><p className="text-xs text-gray-400">Total Messages</p></div>
          <div><p className="text-2xl font-bold text-gray-900">{bookedLeads}</p><p className="text-xs text-gray-400">Booked Leads</p></div>
          <div><p className="text-2xl font-bold text-gray-900">{aiActive}</p><p className="text-xs text-gray-400">AI Active</p></div>
        </div>
      </div>
    </div>
  )
}
```

3. `BarChart3` and `MessageCircle` are already imported in the existing `OverviewPage.tsx`. Confirm imports are present; add if missing.

4. Remove the now-unused `useSetSmartLeads` and `useSetSmartUsage` imports from the file **only if** they are only referenced inside `WhatsAppQuickSection` and nowhere else in `OverviewPage.tsx`. If uncertain, keep them — TypeScript will not error on unused imports (`noUnusedLocals: false`).

**Files:** `src/pages/OverviewPage.tsx`  
**Verify:** `npm run build` exits 0 and all existing KPI cards, charts, and heatmap still render (no code outside `WhatsAppQuickSection` was changed).

---

## Item 12 — Final build verification

Run `npm run build` from the project root. Confirm zero TypeScript errors and zero Vite build errors.

**What to do:**
1. Run `npm run build`
2. If any TS errors appear (e.g., a page still imports a type that changed shape), fix them.
3. Confirm `dist/` folder is produced.

**Files:** all modified files  
**Verify:** `npm run build` exits 0, `dist/index.html` exists.

---

## Implementation Order (dependency chain)

```
Item 1  (types)
  → Item 2  (api/setsmart.ts — imports types)
    → Item 3  (hooks — imports api)
      → Item 4  (Layout.tsx — no data deps, but needs Megaphone/Bot icons)
      → Item 5  (App.tsx — needs page files in Items 6-10 to exist first)
      → Item 6  (WhatsAppAgentPage — imports hooks)
      → Item 7  (WhatsAppConversationsPage — imports hooks + api mutations)
      → Item 8  (TemplatesPage — standalone)
      → Item 9  (CampaignsWAPage — standalone)
      → Item 10 (AIAssistantPage — imports hooks)
      → Item 11 (OverviewPage — imports hooks)
        → Item 5  (App.tsx — after all pages exist)
          → Item 12 (final build)
```

Items 4, 8, 9 have no data dependencies and can be done in any order after Item 1.  
Items 5 must come last (after Items 6–10 exist as modules, otherwise TypeScript will error on the import).

---

## TypeScript Gotchas to Watch

1. **`SetSmartLead.ok_call`** is `string` (value `'N/A'` = not booked, any other value = booked). Filter: `l.ok_call !== 'N/A'`.
2. **`convData` can be `undefined`** until query resolves — always use `convData?.conversations ?? []` and `convData?.total ?? 0`.
3. **`useMutation` from v5** — import from `@tanstack/react-query`; signature is `useMutation({ mutationFn, onSuccess })`.
4. **`useQueryClient`** — import from `@tanstack/react-query`. Call `queryClient.invalidateQueries({ queryKey: ['ss-conversations'] })` after mutations.
5. **Old type fields gone** — `SetSmartLead` no longer has `firstName`, `lastName`, `phoneNumber`, `leadStatus`, `aiEnabled`, `contactName`, `lastMessage`, `lastActivity`, `updatedAt`. Any page still using these will get a TS error. Fix at the usage site: use `l.name`, `l.number`, `l.ok_call !== 'N/A'` respectively.
6. **`WhatsAppLeadsPage.tsx`** imports `useSetSmartAnswered` which now returns `[]` silently — that is fine. It also reads `l.name`, `l.phone`, `l.status`, `l.aiEnabled`, `l.lastMessage`, `l.lastActivity`, `l.updatedAt` — the first three exist in new `SetSmartLead`; the last four (`aiEnabled`, `lastMessage`, `lastActivity`, `updatedAt`) do not. This page must be updated to use `l.number` instead of `l.phone`, and drop/replace the removed fields. Make those fixes as part of Item 3 if tsc fails.
7. **`OverviewPage.tsx` existing `WhatsAppQuickSection`** reads `lead.aiEnabled`, `lead.lastMessage`, `lead.status`, `lead.leadStatus` — all removed in the new type. The rewrite in Item 11 fixes this.

