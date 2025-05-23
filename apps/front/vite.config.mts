import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import vercel from 'vite-plugin-vercel';

export default defineConfig({
  plugins: [react(), tailwindcss(), vercel()],
  vercel:{
    // plugin handles apis automatically
    // catch all write is not working. only handle existing routes for now
    rewrites: [{ source: '/cast', destination: '/index.html' }],
  },
  optimizeDeps: {
    esbuildOptions: { target: "esnext" },
    exclude: ['@noir-lang/noirc_abi', '@noir-lang/acvm_js']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'buffer': 'buffer',
    },
  },
})
