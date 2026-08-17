import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        // Split stable vendors out of the app chunk for better caching
        // and a smaller initial parse.
        manualChunks: {
          'react-core': ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          backend: ['@supabase/supabase-js'],
          charts: ['recharts'],
          dates: ['date-fns'],
          'drag-and-drop': ['@dnd-kit/core'],
        },
      },
    },
  },
})
