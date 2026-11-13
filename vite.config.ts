import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Fail loudly instead of quietly moving to another port while an old tab still points at 5173
    port: 5173,
    strictPort: true,
    // Send API calls from the front-end to the Express server (server/index.ts)
    proxy: {
      '/api': 'http://localhost:' + (process.env.PORT ?? 3001),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
      },
    },
  },
})
