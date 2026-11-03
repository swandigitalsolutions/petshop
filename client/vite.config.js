import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// No database configured on Vercel → run the built-in browser demo backend.
const demo = process.env.VITE_DEMO || (process.env.VERCEL && !process.env.MONGO_URI ? 'true' : 'false');

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { 'import.meta.env.VITE_DEMO': JSON.stringify(demo) },
  server: {
    fs: { allow: ['..'] },
    port: 5173,
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
