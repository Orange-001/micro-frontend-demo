import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import UnoCSS from '@unocss/vite';

export default defineConfig({
  plugins: [react(), UnoCSS()],
  server: {
    strictPort: true
  },
  build: {
    sourcemap: true
  },
  base: process.env.VITE_APP_BASE || '/'
});

