# Sarvam Webhook Server — Carmel College of Nursing

Receives POST payloads from Sarvam after every call, stores them, and
streams live updates to the dashboard via Server-Sent Events (SSE).

**No npm dependencies — pure Node.js stdlib only.**

---

## Quick start

```bash
cd webhook-server
node server.js
```

## Deploy on Hostinger

1. Upload the `webhook-server/` folder to your Hostinger server
2. In Hostinger hPanel → Node.js → Create Application
   - Entry point: `server.js`
   - Node version: 18+
3. The app starts automatically

Or via SSH with PM2:
```bash
npm install -g pm2
pm2 start server.js --name sarvam-webhook
pm2 save && pm2 startup
```

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/webhook/call` | Sarvam posts here after every call |
| GET | `/webhook/calls` | Dashboard polls for stored calls |
| GET | `/events` | SSE stream for live dashboard updates |
| GET | `/health` | Health check |

**Paste this into Sarvam Deploy → Webhook config:**
```
https://darkslategray-giraffe-469443.hostingersite.com/webhook/call
```

---

## Config (.env)

| Variable | Default | Description |
|----------|---------|-------------|
| `WEBHOOK_PORT` | `3001` | Port to listen on |
| `WEBHOOK_SECRET` | _(empty)_ | Optional shared secret for auth |

---

## What it stores per call

Every field Sarvam sends is stored. These are promoted as table columns:

- `call_summary` — what the call was about
- `call_disposition` — interested / callback / not_interested / enrolled etc.
- `caller_name` — name extracted by the agent
- `course_interested_in` — course the caller asked about
- `human_transfer_needed` — whether the agent flagged a transfer
- `recording_url` — direct link to the WAV recording (null if not recorded)
- Full `interaction_transcript` — every turn of the conversation
