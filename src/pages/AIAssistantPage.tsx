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
        <h1 className="text-xl font-semibold text-\[#0f1a14\]">AI Assistant</h1>
        <p className="text-sm text-\[#7b857f\] mt-0.5">Your SetSmart WhatsApp AI assistant configuration.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Assistant Info */}
        <div className="bg-white rounded-\[16px\] border border-\[#e8ebe8\] p-5">
          <h3 className="text-sm font-semibold text-\[#0f1a14\] mb-4 flex items-center gap-2">
            <Bot size={15} className="text-green-500" /> Assistant Details
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-\[#7b857f\] mb-1">Assistant ID</p>
              <p className="text-xs font-mono bg-\[#f5f6f4\] rounded-lg px-3 py-2 text-\[#7b857f\] break-all">{assistantId}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-\[#7b857f\] mb-1">Status</p>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-\[#1f6b47\] bg-\[#d8f58f\]/60 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-\[#a6e22e\]" /> Active
              </span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-\[#7b857f\] mb-1">Conversations Handled</p>
              <p className="text-2xl font-bold text-\[#0f1a14\]">{totalConversations}</p>
            </div>
            <div className="bg-blue-500/10 border border-\[#e8ebe8\] rounded-\[16px\] p-3">
              <p className="text-xs text-blue-400 font-medium">Full assistant configuration</p>
              <p className="text-xs text-blue-400 mt-0.5 opacity-80">Manage your AI assistant's prompts, knowledge base, and behaviour directly in the SetSmart dashboard.</p>
            </div>
          </div>
        </div>

        {/* AI Control */}
        <div className="bg-white rounded-\[16px\] border border-\[#e8ebe8\] p-5">
          <h3 className="text-sm font-semibold text-\[#0f1a14\] mb-4 flex items-center gap-2">
            <Zap size={15} className="text-green-500" /> AI Control
          </h3>
          <div className="bg-\[#f5f6f4\] rounded-\[16px\] p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle size={14} className="text-green-500" />
              <p className="text-sm font-medium text-\[#0f1a14\]">Per-Conversation AI Control</p>
            </div>
            <p className="text-xs text-\[#7b857f\]">
              AI control per conversation is available in the Conversations section.
              You can pause or resume AI for individual contacts from the conversation view.
            </p>
            <a
              href="/whatsapp/conversations"
              className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-green-500 hover:text-\[#1f6b47\]"
            >
              Go to Conversations →
            </a>
          </div>
          <div className="bg-orange-50 border border-\[#e8ebe8\] rounded-\[16px\] p-4">
            <p className="text-xs text-\[#f0883e\] font-medium">Global AI toggle not available</p>
            <p className="text-xs text-\[#f0883e\] mt-1 opacity-80">
              The global AI on/off API endpoints are not available with your current plan.
              Use the SetSmart dashboard for global settings.
            </p>
          </div>
          <a
            href="https://setsmart.io"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 w-full flex items-center justify-center gap-2 bg-\[#1f6b47\] hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Open SetSmart Dashboard <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}
