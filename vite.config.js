import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000, // Portfolio Tracker använder port 3000
    strictPort: false, // Tillåt port fallback om 3000 är upptagen
    open: true,
    host: true, // Tillåt nätverksåtkomst (samma som GANTT)
    hmr: {
      overlay: true
    }
  },
  logLevel: 'info',
  clearScreen: false // Behåll output synlig (samma som GANTT)
})







