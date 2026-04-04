import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.tgs'],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:6001',
        changeOrigin: true,
      }
    }
  }
})
