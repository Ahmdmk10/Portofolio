import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Dev server: send /admin to /admin/ so the admin entry is served instead of the SPA fallback.
const adminSlash = {
  name: 'admin-trailing-slash',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/admin') { res.statusCode = 302; res.setHeader('Location', '/admin/'); res.end() } else next()
    })
  },
}

// GitHub Pages serves a project site at /<repo-name>/, so built asset URLs must start with that prefix.
// Override with VITE_BASE (e.g. '/' for a custom domain or user.github.io repo).
export default defineConfig(({ command }) => ({
  base: command === 'build' ? (process.env.VITE_BASE || '/Portofolio/') : '/',
  plugins: [react(), tailwindcss(), adminSlash],
  build: {
    rollupOptions: {
      input: { main: resolve(__dirname, 'index.html'), admin: resolve(__dirname, 'admin/index.html') },
    },
  },
}))
