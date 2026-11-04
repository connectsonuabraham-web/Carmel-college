import React from 'react'
import { Key, Building2, Webhook, Radio, CheckCircle2, AlertCircle, Copy } from 'lucide-react'
import { useWebhookStream } from '../hooks/useWebhookStream'

const PUBLIC_DOMAIN = 'https://darkslategray-giraffe-469443.hostingersite.com'

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="font-mono text-xs bg-gray-900 text-green-400 rounded-xl px-4 py-3 overflow-x-auto whitespace-pre-wrap break-all select-all">
      {children}
    </pre>
  )
}

function CopyableUrl({ url }: { url: string }) {
  const [copied, setCopied] = React.useState(false)
  const copy = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 group">
      <p className="font-mono text-xs text-gray-800 flex-1 break-all">{url}</p>
      <button onClick={copy} className="flex-shrink-0 p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
        {copied
          ? <CheckCircle2 size={13} className="text-green-500" />
          : <Copy size={13} />
        }
      </button>
    </div>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{n}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 mb-2">{title}</p>
        {children}
      </div>
    </div>
  )
}

export function SettingsPage() {
  const { status } = useWebhookStream()

  const statusInfo = {
    connected:    { icon: <CheckCircle2 size={15} className="text-green-500" />, label: 'Webhook connected — real-time call updates active ✓', cls: 'bg-green-50 border-green-200 text-green-700' },
    connecting:   { icon: <Radio size={15} className="text-yellow-500 animate-pulse" />, label: 'Connecting to webhook server…', cls: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
    disconnected: { icon: <AlertCircle size={15} className="text-red-500" />, label: 'Webhook disconnected — start the server (see Step 1 below)', cls: 'bg-red-50 border-red-200 text-red-700' },
    unavailable:  { icon: <AlertCircle size={15} className="text-gray-400" />, label: 'Webhook server unreachable — dashboard uses 62s polling fallback', cls: 'bg-gray-50 border-gray-200 text-gray-600' },
  }[status]

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">API configuration, webhook setup, and workspace details</p>
      </div>

      {/* Live webhook status */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${statusInfo.cls}`}>
        {statusInfo.icon}
        {statusInfo.label}
      </div>

      {/* Org + API key cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <Building2 size={18} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Organization</h3>
              <p className="text-xs text-gray-400">Sarvam workspace identity</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Organization ID', value: '01a02774-5a8e-7417-83b2-bcd5ec5b0a93' },
              { label: 'Workspace ID',    value: '01a02774-5a93-78e1-88df-42475fe29aa0' },
              { label: 'App ID',          value: 'Conversatio-63a490c9-20af' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="font-mono text-xs bg-gray-50 rounded-lg px-3 py-2 text-gray-700 select-all">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
              <Key size={18} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">API Key</h3>
              <p className="text-xs text-gray-400">Sarvam authentication</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">API Key</p>
              <p className="font-mono text-xs bg-gray-50 rounded-lg px-3 py-2 text-gray-700">sk_aestf8eu_••••••••••••••••••</p>
              <p className="text-xs text-gray-400 mt-2">Set in <code className="bg-gray-100 px-1 rounded">.env</code> → <code className="bg-gray-100 px-1 rounded">VITE_SARVAM_API_KEY</code></p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Dashboard Domain</p>
              <p className="font-mono text-xs bg-gray-50 rounded-lg px-3 py-2 text-green-700 break-all select-all">{PUBLIC_DOMAIN}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Webhook setup */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
            <Webhook size={18} className="text-green-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Real-Time Webhook Setup</h3>
            <p className="text-xs text-gray-400">New calls appear instantly — no 60s API cache delay</p>
          </div>
        </div>

        <div className="space-y-7">
          <Step n={1} title="Start the webhook server (run in a terminal on your server)">
            <CodeBlock>node webhook-server/server.js</CodeBlock>
            <p className="text-xs text-gray-500 mt-2">
              Runs on port 3001. On Hostinger, make sure port 3001 is open or configure a reverse proxy.
            </p>
          </Step>

          <Step n={2} title="Paste these URLs into Sarvam Deploy → Webhooks">
            <p className="text-xs text-gray-500 mb-3">
              Go to <strong>apps.sarvam.ai → Deploy → your deployment → Webhook config</strong>
              and set the webhook URL. Copy the exact URL for your call type:
            </p>
            <div className="space-y-2">
              <div>
                <p className="text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-wide">Inbound calls</p>
                <CopyableUrl url={`${PUBLIC_DOMAIN}/webhook/inbound`} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-wide">Campaign calls</p>
                <CopyableUrl url={`${PUBLIC_DOMAIN}/webhook/campaign`} />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 mb-1 font-medium uppercase tracking-wide">Instant outbound calls</p>
                <CopyableUrl url={`${PUBLIC_DOMAIN}/webhook/outbound`} />
              </div>
            </div>
          </Step>

          <Step n={3} title="Test the webhook is working">
            <p className="text-xs text-gray-500 mb-2">Check the health endpoint — should return <code className="bg-gray-100 px-1 rounded">status: ok</code>:</p>
            <CopyableUrl url={`${PUBLIC_DOMAIN}/health`} />
          </Step>

          <Step n={4} title="Make a call — dashboard updates instantly">
            <div className="bg-green-50 rounded-xl px-4 py-3 border border-green-100">
              <p className="text-xs text-green-700 font-semibold mb-2">What arrives the moment a call ends:</p>
              <ul className="text-xs text-green-700 space-y-1 list-disc list-inside">
                <li>Call status — connected / no answer / busy / failed</li>
                <li>Duration, caller number, agent phone number</li>
                <li>Full transcript (every turn, translated to English)</li>
                <li>Final agent variables (data extracted during the call)</li>
                <li>Failure reason if the call didn't connect</li>
              </ul>
              <p className="text-xs text-green-600 mt-2 font-medium">
                Dashboard shows a <span className="text-green-700">📞 New call received!</span> toast and refreshes all charts immediately.
              </p>
            </div>
          </Step>
        </div>
      </div>

      {/* Recording info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none"/></svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Call Recordings</h3>
            <p className="text-xs text-gray-400">Dual-channel WAV — how recordings are fetched</p>
          </div>
        </div>
        <div className="space-y-3 text-xs text-gray-600">
          <p>Every connected call is recorded as a <strong>stereo WAV file</strong>:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-500">
            <li><strong>Left channel</strong> — caller (user)</li>
            <li><strong>Right channel</strong> — agent</li>
          </ul>
          <p>The dashboard fetches recordings directly from Sarvam using:</p>
          <CodeBlock>{`GET https://apps.sarvam.ai/api/analytics/v1/
  {org_id}/{workspace_id}/{app_id}/recordings/{interaction_id}
Header: X-API-Key: <your-key>
Response: audio/wav`}</CodeBlock>
          <p className="text-gray-500">
            The <code className="bg-gray-100 px-1 rounded">interaction_id</code> contains a <code className="bg-gray-100 px-1 rounded">/</code> (e.g. <code className="bg-gray-100 px-1 rounded">20261104/abc-uuid</code>).
            The dashboard encodes it as <code className="bg-gray-100 px-1 rounded">%2F</code> so it's treated as one path segment.
            Open any call in <strong>Calls → Transcript tab</strong> to play the recording inline.
          </p>
        </div>
      </div>
    </div>
  )
}
