import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Expose server to network (needed for Cursor port forwarding)
    port: 5173,
    strictPort: false, // Allow fallback to another port if 5173 is in use
  },
})
