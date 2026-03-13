import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/aplikasi-stok-kerabat/waste-detail/',
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 5183,
    strictPort: true,
  },
  define: {
    'process.env': {}
  }
})
