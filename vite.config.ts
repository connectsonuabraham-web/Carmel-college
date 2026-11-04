import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * In dev: Vite proxies /api/* to the local Express server (server.js on :3001)
 * In prod (Vercel): /api/* routes are handled by Vercel serverless functions in api/
 *
 * Run both together for local dev:
 *   Terminal 1: node server.js        (Express on :3001)
 *   Terminal 2: npm run dev:ui        (Vite HMR on :5173)
 *
 * Or just: npm start  (Express serves built dist/ on :3001 — no HMR)
 */
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target:      'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
