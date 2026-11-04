import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const ORG_ID = '01a02774-5a8e-7417-83b2-bcd5ec5b0a93'
const WS_ID  = '01a02774-5a93-78e1-88df-42475fe29aa0'
const APP_ID = 'Conversatio-63a490c9-20af'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Main analytics proxy (interactions, attempts, transcripts, recordings, traces)
      '/api-proxy': {
        target: 'https://apps.sarvam.ai',
        changeOrigin: true,
        // Keep %2F encoded — do NOT decode it before forwarding
        // This is critical for recording URLs like /recordings/20261104%2Fabc
        secure: true,
        rewrite: (path) => path.replace(/^\/api-proxy/, '/api/analytics/v1'),
      },
      // Campaigns proxy
      '/campaigns-proxy': {
        target: 'https://apps.sarvam.ai',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/campaigns-proxy/, `/api/scheduling/v1/orgs/${ORG_ID}/workspaces/${WS_ID}`),
      },
      // Boards proxy
      '/boards-proxy': {
        target: 'https://apps.sarvam.ai',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/boards-proxy/, `/api/analytics/v1/${ORG_ID}/${WS_ID}/boards`),
      },
    },
  },
})
