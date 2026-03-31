import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from '@unocss/vite';
import qiankun from 'vite-plugin-qiankun';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    qiankun('vue-child', {
      useDevMode: true
    }),
    cssInjectedByJsPlugin()
  ],
  server: {
    strictPort: true,
    port: 3001
  },
  base: process.env.VITE_APP_BASE || '/'
});

