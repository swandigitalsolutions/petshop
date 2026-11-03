import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Served at /admin/ on Vercel (ADMIN_BASE=/admin/), at / when deployed on its own.
// Vercel passes the full path (/admin/...) to the service, so the files must also
// live under dist/admin/ for the static server to find them.
const base = process.env.ADMIN_BASE || '/';

export default defineConfig({
  base,
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
    outDir: base === '/' ? 'dist' : `dist${base.replace(/\/$/, '')}`,
    emptyOutDir: true,
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
