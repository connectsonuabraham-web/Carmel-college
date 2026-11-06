import React from 'react'
import { FileText, ExternalLink } from 'lucide-react'

export function TemplatesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-\[#0f1a14\]">Templates</h1>
        <p className="text-sm text-\[#7b857f\] mt-0.5">WhatsApp message templates for your campaigns.</p>
      </div>
      <div className="bg-orange-50 border border-\[#e8ebe8\] rounded-\[16px\] p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-\[16px\] bg-orange-50 flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-\[#f0883e\]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-\[#f0883e\]">Templates API not available</p>
            <p className="text-sm text-\[#f0883e\] mt-1 opacity-80">
              The SetSmart Templates API is not accessible with your current API key.
              Manage templates directly in your SetSmart dashboard at setsmart.io.
            </p>
            <a
              href="https://setsmart.io"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 bg-\[#1f6b47\] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            >
              Open SetSmart Dashboard <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
