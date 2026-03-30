import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import UnoCSS from '@unocss/vite';
import qiankun from 'vite-plugin-qiankun';

export default defineConfig({
  plugins: [
    react(),
    UnoCSS(),
    qiankun('react-child', {
      useDevMode: true
    })
  ],
  server: {
    strictPort: true,
    port: 3002
  },
  base: '/'
});

