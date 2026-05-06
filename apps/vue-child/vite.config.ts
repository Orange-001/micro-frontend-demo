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
      useDevMode: true,
    }),
    cssInjectedByJsPlugin(),
  ],
  server: {
    strictPort: true,
    port: 3001,
  },
  build: {
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('echarts')) return 'vendor-echarts';
          if (id.includes('three')) return 'vendor-three';
          if (id.includes('/ol/') || id.includes('\\ol\\')) return 'vendor-openlayers';
          if (id.includes('vue') || id.includes('pinia')) return 'vendor-vue';
        },
      },
    },
  },
  base: process.env.VITE_APP_BASE || '/',
});
