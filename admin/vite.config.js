import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// On Vercel (services) the admin is served at /admin/. Vercel passes the full path
// (/admin/...) to the service, so the files must also live under dist/admin/.
// Elsewhere it is served at / unless ADMIN_BASE says otherwise.
const onVercel = Boolean(process.env.VERCEL);
const base = process.env.ADMIN_BASE || (onVercel ? '/admin/' : '/');
// No database configured on Vercel → run the built-in browser demo backend.
const demo = process.env.VITE_DEMO || (onVercel && !process.env.MONGO_URI ? 'true' : 'false');
const storeUrl = process.env.VITE_STORE_URL ?? (onVercel ? '' : undefined);

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  define: {
    'import.meta.env.VITE_DEMO': JSON.stringify(demo),
    ...(storeUrl !== undefined ? { 'import.meta.env.VITE_STORE_URL': JSON.stringify(storeUrl) } : {}),
  },
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
