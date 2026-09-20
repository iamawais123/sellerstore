import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      // Serves the admin-dashboard dev server under the same origin so both apps
      // share browser storage: the "log in as seller" hand-off and the admin's Firebase
      // session (used to read a seller's data). Run the admin dashboard's own
      // `npm run dev` (port 5174) alongside this one, then open /admin-app/ from here
      // rather than hitting port 5174 directly.
      '/admin-app': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        ws: true,
      },
      // Same idea for the super-admin dashboard (its own dev server on port 5175), so the
      // storefront, admin console and super-admin console all share one origin's storage
      // (their Firebase sessions and the "log in as" hand-offs).
      '/super-admin-app': {
        target: 'http://localhost:5175',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
