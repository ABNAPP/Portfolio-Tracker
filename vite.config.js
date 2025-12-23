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
  build: {
    chunkSizeWarningLimit: 1000, // Öka gränsen till 1000 kB för att undvika varningar
    rollupOptions: {
      output: {
        manualChunks: {
          // Separera stora bibliotek i egna chunks
          'react-vendor': ['react', 'react-dom'],
          'chart-vendor': ['recharts'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'map-vendor': ['react-simple-maps']
        }
      }
    }
  },
  logLevel: 'info',
  clearScreen: false // Behåll output synlig (samma som GANTT)
})







