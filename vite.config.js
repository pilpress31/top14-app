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
    // Le lazy-loading par route (App.jsx) découpe déjà le gros du bundle.
    // Ici on isole UNIQUEMENT le cœur partagé (react/router/supabase) +
    // les libs lourdes ponctuelles, et on laisse Rollup co-localiser le reste
    // avec le chunk de la page qui l'utilise.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('react-router')) return 'router';
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'react-vendor';
          if (id.includes('@supabase')) return 'supabase';
          if (id.includes('recharts') || id.includes('d3-') || id.includes('chart.js')) return 'charts';
          if (id.includes('html-to-image')) return 'export-image';
          // reste : auto-split par Rollup (co-localisé avec le chunk de page)
        },
      },
    },
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
