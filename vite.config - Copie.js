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

  server: {
    host: true,                      // Écoute sur 0.0.0.0 (accès externe)
    port: 5173,                      // Port du dev server
    allowedHosts: ['jeedom31190.ddns.net'], // Autorise ton domaine DDNS

    proxy: {
      '/api': {
        target: 'https://top14-api.vercel.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
});

