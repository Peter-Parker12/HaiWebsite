import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In dev the API runs separately on 8392 (docker compose or `npm run dev` in server/).
export default defineConfig({
  plugins: [react()],
  // Excalidraw reads this at build time.
  define: { 'process.env.IS_PREACT': JSON.stringify('false') },
  server: { port: 5173, host: true, proxy: { '/api': 'http://localhost:8392' } },
})
