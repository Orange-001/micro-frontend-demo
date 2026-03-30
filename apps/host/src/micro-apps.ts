import { registerMicroApps, start } from 'qiankun';

let qiankunStarted = false;

function getEnvUrl(key: string, fallback: string) {
  const v = (import.meta as any).env?.[key] as string | undefined;
  return v && v.trim().length > 0 ? v : fallback;
}

export function startQiankun() {
  if (qiankunStarted) return;
  qiankunStarted = true;

  const vueEntry = getEnvUrl('VITE_VUE_ENTRY', 'http://localhost:3001/');
  const reactEntry = getEnvUrl('VITE_REACT_ENTRY', 'http://localhost:3002/');

  registerMicroApps([
    {
      name: 'vue-child',
      entry: vueEntry,
      container: '#micro-viewport',
      activeRule: '/vue'
    },
    {
      name: 'react-child',
      entry: reactEntry,
      container: '#micro-viewport',
      activeRule: '/react'
    }
  ]);

  start({
    sandbox: {
      experimentalStyleIsolation: true
    },
    // 也可以根据需要开预加载
    prefetch: false
  });
}

