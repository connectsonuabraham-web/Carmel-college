import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite is now used ONLY for building the React frontend into dist/.
// All proxying (Sarvam API, webhook routes) is handled by the Express
// server in server.js — which works in both dev and production.
//
// To develop:
//   npm run build      — builds the React app into dist/
//   npm start          — starts Express (serves dist/ + all APIs)
//
// Or for hot-reload UI dev only:
//   npm run dev:ui     — Vite HMR on :5173 (no API proxy, just UI)

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
