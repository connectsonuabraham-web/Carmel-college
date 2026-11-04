import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    port: 5173,
    proxy: {
      // Proxy all API and SSE calls to the local Express server in dev
      '/api':    { target: 'http://localhost:3001', changeOrigin: true },
      '/events': { target: 'http://localhost:3001', changeOrigin: true, ws: true },
    },
  },
})
