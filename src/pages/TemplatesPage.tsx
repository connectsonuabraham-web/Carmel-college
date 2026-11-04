import React from 'react'
import { FileText, ExternalLink } from 'lucide-react'

export function TemplatesPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
        <p className="text-sm text-gray-500 mt-0.5">WhatsApp message templates for your campaigns.</p>
      </div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <FileText size={18} className="text-yellow-700" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-yellow-800">Templates API not available</p>
            <p className="text-sm text-yellow-700 mt-1">
              The SetSmart Templates API is not accessible with your current API key.
              Manage templates directly in your SetSmart dashboard at setsmart.io.
            </p>
            <a
              href="https://setsmart.io"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              Open SetSmart Dashboard <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
