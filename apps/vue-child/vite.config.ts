import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import UnoCSS from '@unocss/vite';
import qiankun from 'vite-plugin-qiankun';

export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    qiankun('vue-child', {
      useDevMode: true
    })
  ],
  server: {
    strictPort: true,
    port: 3001
  },
  base: '/'
});

