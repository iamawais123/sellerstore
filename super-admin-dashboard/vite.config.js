import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // One .env at the repo root configures Firebase for the storefront and both dashboards.
  envDir: '..',
  // Served under /super-admin-app/ on the main app's origin (via its dev proxy, or
  // as a merged static build in production) so this app shares browser storage
  // (Firebase sessions, "log in as" hand-offs) with the admin console and the
  // storefront instead of living on its own origin.
  base: '/super-admin-app/',
  server: {
    port: 5175,
    open: false,
    hmr: {
      clientPort: 5173,
    },
  },
})
