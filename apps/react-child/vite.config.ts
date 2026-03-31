import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import UnoCSS from '@unocss/vite';
import qiankun from 'vite-plugin-qiankun';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [
    react(),
    UnoCSS(),
    qiankun('react-child', {
      useDevMode: true
    }),
    cssInjectedByJsPlugin()
  ],
  server: {
    strictPort: true,
    port: 3002
  },
  base: process.env.VITE_APP_BASE || '/'
});

