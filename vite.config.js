import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy N2YO API calls to avoid CORS in development
      // TODO: In production, route these through a backend server
      '/api/n2yo': {
        target: 'https://api.n2yo.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/n2yo/, ''),
        headers: {
          'Accept': 'application/json',
        }
      },
      // Proxy AstronomyAPI calls
      '/api/astronomy': {
        target: 'https://api.astronomyapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/astronomy/, ''),
      }
    }
  }
})
