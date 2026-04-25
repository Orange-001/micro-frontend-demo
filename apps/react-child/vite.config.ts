import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import UnoCSS from '@unocss/vite';
import qiankun from 'vite-plugin-qiankun';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

const useStableJsChunks = process.env.VITE_STABLE_JS_CHUNKS === 'true';

export default defineConfig({
  plugins: [
    react(),
    UnoCSS(),
    qiankun('react-child', {
      useDevMode: true,
    }),
    cssInjectedByJsPlugin(),
  ],
  server: {
    strictPort: true,
    port: 3002,
  },
  build: {
    rollupOptions: {
      output: {
        ...(useStableJsChunks
          ? {
              entryFileNames: 'assets/[name].js',
              chunkFileNames: 'assets/[name].js',
            }
          : {}),
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('mermaid') || id.includes('cytoscape') || id.includes('dagre')) {
            return 'vendor-mermaid';
          }
          if (
            id.includes('katex') ||
            id.includes('react-markdown') ||
            id.includes('remark-') ||
            id.includes('rehype-') ||
            id.includes('highlight.js') ||
            id.includes('unified') ||
            id.includes('micromark') ||
            id.includes('mdast') ||
            id.includes('hast')
          ) {
            return 'vendor-markdown';
          }
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'vendor-react';
          }
          if (id.includes('antd') || id.includes('@ant-design')) return 'vendor-react';
        },
      },
    },
  },
  base: process.env.VITE_APP_BASE || '/',
});
