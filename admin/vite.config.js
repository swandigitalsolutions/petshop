import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Served at /admin/ in the single-project Vercel demo; at / when deployed on its own.
  base: process.env.ADMIN_BASE || '/',
  plugins: [react(), tailwindcss()],
  server: {
    fs: { allow: ['..'] },
    port: 5174,
    proxy: {
      '/api': 'http://localhost:5000',
      '/static': 'http://localhost:5000',
      '/uploads': 'http://localhost:5000',
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
