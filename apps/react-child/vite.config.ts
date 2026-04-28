import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import UnoCSS from '@unocss/vite';
import qiankun from 'vite-plugin-qiankun';

const useStableJsChunks = process.env.VITE_STABLE_JS_CHUNKS === 'true';

export default defineConfig({
  plugins: [
    react(),
    UnoCSS(),
    qiankun('react-child', {
      useDevMode: true,
    }),
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
          const normalizedId = id.replace(/\\/g, '/');
          if (!normalizedId.includes('/node_modules/')) return;
          if (
            normalizedId.includes('/node_modules/mermaid') ||
            normalizedId.includes('/node_modules/cytoscape') ||
            normalizedId.includes('/node_modules/dagre')
          ) {
            return 'vendor-mermaid';
          }
          if (
            normalizedId.includes('/node_modules/katex') ||
            normalizedId.includes('/node_modules/react-markdown') ||
            normalizedId.includes('/node_modules/remark-') ||
            normalizedId.includes('/node_modules/rehype-') ||
            normalizedId.includes('/node_modules/highlight.js') ||
            normalizedId.includes('/node_modules/unified') ||
            normalizedId.includes('/node_modules/micromark') ||
            normalizedId.includes('/node_modules/mdast') ||
            normalizedId.includes('/node_modules/hast')
          ) {
            return 'vendor-markdown';
          }
          if (
            normalizedId.includes('/node_modules/react/') ||
            normalizedId.includes('/node_modules/react-dom/') ||
            normalizedId.includes('/node_modules/react-router') ||
            normalizedId.includes('/node_modules/scheduler/')
          ) {
            return 'vendor-react';
          }
          if (
            normalizedId.includes('/node_modules/antd/') ||
            normalizedId.includes('/node_modules/@ant-design/') ||
            normalizedId.includes('/node_modules/@rc-component/') ||
            normalizedId.includes('/node_modules/rc-') ||
            normalizedId.includes('/node_modules/dayjs/')
          ) {
            return 'vendor-antd';
          }
          if (
            normalizedId.includes('/node_modules/@reduxjs/') ||
            normalizedId.includes('/node_modules/react-redux/') ||
            normalizedId.includes('/node_modules/redux') ||
            normalizedId.includes('/node_modules/immer/') ||
            normalizedId.includes('/node_modules/reselect/')
          ) {
            return 'vendor-state';
          }
          if (normalizedId.includes('/node_modules/styled-components/')) {
            return 'vendor-styled';
          }
        },
      },
    },
  },
  base: process.env.VITE_APP_BASE || '/',
});
