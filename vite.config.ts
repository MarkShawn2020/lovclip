import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { LovinspPlugin } from 'lovinsp'

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src')
    },
  },
  plugins: [
    LovinspPlugin({ bundler: 'vite' }),
    tailwindcss(),
    react(),
  ],
  server: {
    port: 7777,
    strictPort: true,
    host: '127.0.0.1',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  clearScreen: false,
})
