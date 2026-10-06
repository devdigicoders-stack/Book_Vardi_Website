import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    dedupe: ['react', 'react-dom']
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const cleanId = id.replace(/\\/g, '/');
          if (cleanId.includes('node_modules/lucide-react/')) {
            return 'vendor-icons';
          }
          if (
            cleanId.includes('node_modules/react/') ||
            cleanId.includes('node_modules/react-dom/') ||
            cleanId.includes('node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }
          if (cleanId.includes('src/components/Common/OrderTrackingModal')) {
            return 'OrderTrackingModal';
          }
          if (cleanId.includes('src/components/Common/ReturnExchangeModal')) {
            return 'ReturnExchangeModal';
          }
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
