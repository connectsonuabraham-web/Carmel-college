# Carmel College of Nursing — Voice Agent Dashboard

A Node.js + Express web application for monitoring Sarvam AI voice agent calls.

## How it works

Single `server.js` entry point that does everything:

- Serves the React dashboard from `dist/` (pre-built, included in repo)
- Proxies Sarvam API calls server-side (API key never exposed to browser)
- Receives webhooks from Sarvam after every call
- Streams live call updates to the dashboard via SSE

## Deploy on Hostinger (Node.js App)

1. Upload / pull this repo
2. In hPanel → Node.js → Create Application
   - **Entry point:** `server.js`
   - **Node version:** 18+
   - **Start command:** `node server.js`
3. Set environment variables in hPanel:
   ```
   PORT=3001
   SARVAM_API_KEY=sk_aestf8eu_yWovruzA9d6mwtWIBjTMP3Q1
   WEBHOOK_SECRET=   (optional)
   ```
4. Run `npm install` (no build needed — dist/ is pre-built)
5. Start the app

## Deploy on Vercel

1. Import the GitHub repo
2. Set environment variables (same as above)
3. Vercel auto-detects `vercel.json` and deploys as Node.js

## Local development

```bash
npm install
npm start          # serves on http://localhost:3001
```

To rebuild the React frontend after UI changes:
```bash
npm run build      # rebuilds dist/
npm start
```

## Webhook URL to paste in Sarvam

```
https://your-domain.com/webhook/call
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | React dashboard |
| POST | `/webhook/call` | Sarvam posts here after every call |
| GET | `/webhook/calls` | Paginated call list |
| GET | `/events` | SSE live stream |
| GET | `/health` | Health check |
| GET | `/api-proxy/*` | Sarvam analytics API proxy |
