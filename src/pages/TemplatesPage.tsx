import React from 'react'
import { FileText, ExternalLink } from 'lucide-react'

export function TemplatesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-[#f1f5f9]">Templates</h1>
        <p className="text-sm text-[#475569] mt-0.5">WhatsApp message templates for your campaigns.</p>
      </div>
      <div className="bg-amber-500/10 border border-white/[0.06] rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-400">Templates API not available</p>
            <p className="text-sm text-amber-400 mt-1 opacity-80">
              The SetSmart Templates API is not accessible with your current API key.
              Manage templates directly in your SetSmart dashboard at setsmart.io.
            </p>
            <a
              href="https://setsmart.io"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Open SetSmart Dashboard <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
