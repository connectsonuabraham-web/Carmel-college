# Carmel College of Nursing — Voice Agent Dashboard

Sarvam AI Voice Agent analytics dashboard. Single Node.js + Express app.

## Deploy on Hostinger (Node.js App)

### 1. Upload to Hostinger
- hPanel → Git → connect to `https://github.com/connectsonuabraham-web/Carmel-college`
- Or upload the zip via File Manager

### 2. Set up Node.js App in hPanel
- hPanel → Node.js → Create Application
- **Node.js version:** 18+
- **Application root:** `/` (or wherever you uploaded)
- **Application URL:** your domain
- **Application startup file:** `server.js`

### 3. Set Environment Variables in hPanel
```
PORT=3001
SARVAM_API_KEY=sk_aestf8eu_yWovruzA9d6mwtWIBjTMP3Q1
WEBHOOK_SECRET=
```

### 4. Install dependencies & start
In hPanel terminal or SSH:
```bash
npm install
npm start
```

No build step needed — `dist/` is pre-built and included in the repo.

### 5. Set webhook URL in Sarvam
Go to **apps.sarvam.ai → Deploy → your deployment → Webhook config**:
```
https://lightsteelblue-ram-997091.hostingersite.com/api/webhook/call
```

## Local development

```bash
npm install
npm start        # Express on http://localhost:3001
```

Or with hot-reload UI:
```bash
# Terminal 1
npm start        # Express on :3001

# Terminal 2  
npm run dev:ui   # Vite HMR on :5173 (proxies /api/* to :3001)
```

## Endpoints

| Route | Description |
|-------|-------------|
| `GET /` | React dashboard |
| `GET /api/health` | Health check |
| `POST /api/webhook/call` | Sarvam posts here after every call |
| `GET /api/webhook/calls` | Paginated stored calls |
| `GET /events` | SSE live stream |
| `GET /api/sarvam/*` | Sarvam analytics proxy |
| `GET /api/campaigns/*` | Sarvam campaigns proxy |
| `GET /api/boards/*` | Sarvam boards proxy |
