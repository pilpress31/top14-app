import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    // PAS de manualChunks : le lazy-loading par route (App.jsx) fait déjà le
    // gros du découpage. Laisser Rollup gérer le découpage des vendors garantit
    // que React est initialisé AVANT les libs qui en dépendent (recharts/d3).
    // Un manualChunks qui isole React dans son propre chunk casse cet ordre
    // → "can't access property forwardRef of undefined".
    chunkSizeWarningLimit: 700,
  },

  server: {
    host: true,                      // Écoute sur 0.0.0.0 (accès externe)
    port: 5173,                      // Port du dev server
    allowedHosts: ['app.top14pronos.fr', 'app.top14pronos.fr'], // Autorise ton domaine Cloudflare Tunnel

    proxy: {
      '/api': {
        target: 'https://top14-api.vercel.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
});
