// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // vercel dev server
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // Optional base path if deploying under a subfolder:
  // base: '/photos/26Jul2025/',
})
