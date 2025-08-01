import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/PedagogicCaseBuilder/',
  server: {
    port: 8000,
    host: '0.0.0.0',
    strictPort: true
  }
})