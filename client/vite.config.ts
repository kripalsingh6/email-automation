import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  root: path.resolve(import.meta.dirname),
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/auth': 'http://localhost:3001'
    }
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  }
})
