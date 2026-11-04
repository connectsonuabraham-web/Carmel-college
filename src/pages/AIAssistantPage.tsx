import React from 'react'
import { Bot, ExternalLink, MessageCircle, Zap } from 'lucide-react'
import { useLeads, useConversations } from '../hooks/useSetSmart'

export function AIAssistantPage() {
  const { data: leads = [] } = useLeads()
  const { data: convsResp } = useConversations()
  const totalConversations = convsResp?.total ?? 0

  const assistantId = leads[0]?.assistant_id || 'asst_hqrN2ycoPOmNKG4kdG16IhsmV3wX03nt'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your SetSmart WhatsApp AI assistant configuration.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Assistant Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Bot size={15} className="text-green-500" /> Assistant Details
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">Assistant ID</p>
              <p className="text-xs font-mono bg-gray-50 rounded-lg px-3 py-2 text-gray-700 break-all">{assistantId}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">Status</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
              </span>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">Conversations Handled</p>
              <p className="text-2xl font-bold text-gray-900">{totalConversations}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs text-blue-700 font-medium">Full assistant configuration</p>
              <p className="text-xs text-blue-600 mt-0.5">Manage your AI assistant's prompts, knowledge base, and behaviour directly in the SetSmart dashboard.</p>
            </div>
          </div>
        </div>

        {/* AI Control */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap size={15} className="text-green-500" /> AI Control
          </h3>
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle size={14} className="text-green-500" />
              <p className="text-sm font-medium text-gray-800">Per-Conversation AI Control</p>
            </div>
            <p className="text-xs text-gray-500">
              AI control per conversation is available in the Conversations section.
              You can pause or resume AI for individual contacts from the conversation view.
            </p>
            <a
              href="/whatsapp/conversations"
              className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-green-600 hover:text-green-700"
            >
              Go to Conversations →
            </a>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4">
            <p className="text-xs text-yellow-800 font-medium">Global AI toggle not available</p>
            <p className="text-xs text-yellow-700 mt-1">
              The global AI on/off API endpoints are not available with your current plan.
              Use the SetSmart dashboard for global settings.
            </p>
          </div>
          <a
            href="https://setsmart.io"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Open SetSmart Dashboard <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}
