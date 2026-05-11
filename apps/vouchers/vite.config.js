import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  base: '/vouchers/',
  plugins: [react()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 5201,
    strictPort: true,
  },
  define: {
    'process.env': {}
  },
  build: {
    sourcemap: false,
    outDir: 'dist',
  }
})
