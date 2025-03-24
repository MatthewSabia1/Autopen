import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    // Set proxy for Supabase requests to avoid CORS issues
    proxy: {
      '/supabase-proxy': {
        target: 'https://lyusrmqbqvkbglnluvdi.supabase.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/supabase-proxy/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
        },
      },
    },
  },
});