import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: false,
    proxy: {
      '/api/kp2mi-vokasi': {
        target: 'https://vokasi.kp2mi.go.id',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kp2mi-vokasi/, ''),
        secure: false,
      },
      '/api/siskop-file': {
        target: 'https://api-siskop2mi.kp2mi.go.id',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/siskop-file/, ''),
        secure: false,
      },
    },
  },
});
