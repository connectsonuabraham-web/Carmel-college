import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { OverviewPage } from './pages/OverviewPage'
import { CallsPage } from './pages/CallsPage'
import { AttemptsPage } from './pages/AttemptsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { CampaignsPage } from './pages/CampaignsPage'
import { GroupByPage } from './pages/GroupByPage'
import { BoardsPage } from './pages/BoardsPage'
import { SettingsPage } from './pages/SettingsPage'
import { WebhookCallsPage } from './pages/WebhookCallsPage'
import { WhatsAppAgentPage } from './pages/WhatsAppAgentPage'
import { WhatsAppConversationsPage } from './pages/WhatsAppConversationsPage'
import { WhatsAppLeadsPage } from './pages/WhatsAppLeadsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<OverviewPage />} />
        <Route path="calls" element={<CallsPage />} />
        <Route path="live-calls" element={<WebhookCallsPage />} />
        <Route path="attempts" element={<AttemptsPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="group-by" element={<GroupByPage />} />
        <Route path="boards" element={<BoardsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="whatsapp" element={<WhatsAppAgentPage />} />
        <Route path="whatsapp/conversations" element={<WhatsAppConversationsPage />} />
        <Route path="whatsapp/leads" element={<WhatsAppLeadsPage />} />
      </Route>
    </Routes>
  )
}
