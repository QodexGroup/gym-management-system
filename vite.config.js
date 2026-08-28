import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

/**
 * Paths that belong to the public registration entry rather than the admin SPA.
 * Matches /join, /join/, /join/<code> and any query string, but deliberately NOT
 * /join.html itself or asset requests like /join-abc123.js.
 */
const JOIN_PATH = /^\/join(\/|$|\?)/

/**
 * Serve join.html for /join/:publicCode during `vite dev` and `vite preview`.
 *
 * In production the "/join/**" rewrite in firebase.json does this, but that
 * config only applies to deployed Firebase Hosting. Without this plugin the dev
 * server falls back to index.html, the admin SPA boots, and its catch-all route
 * redirects the visitor to /dashboard — so a copied registration link appears
 * broken on localhost while working fine once deployed.
 *
 * @returns {import('vite').Plugin}
 */
const joinEntryRewrite = () => {
  /**
   * Point the request at the public entry document.
   *
   * @param {import('connect').Server} middlewares
   * @returns {void}
   */
  const attach = (middlewares) => {
    middlewares.use((req, _res, next) => {
      if (req.url && JOIN_PATH.test(req.url)) {
        req.url = '/join.html'
      }
      next()
    })
  }

  return {
    name: 'join-entry-rewrite',
    configureServer: (server) => attach(server.middlewares),
    configurePreviewServer: (server) => attach(server.middlewares),
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), joinEntryRewrite()],
  build: {
    rollupOptions: {
      input: {
        // Admin app.
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        // Public member self-registration (/join/:publicCode). A separate entry
        // so the public page does not ship the Firebase SDK, react-query, the
        // route guards or the rest of the admin bundle. Served by the
        // "/join/**" rewrite in firebase.json, and by joinEntryRewrite() locally.
        join: fileURLToPath(new URL('./join.html', import.meta.url)),
      },
    },
  },
  server: {
    host: true, // Expose server to network (needed for Cursor port forwarding)
    port: 5173,
    strictPort: false, // Allow fallback to another port if 5173 is in use
  },
})
