export const MICRO_APP_CONTAINER_ID = 'micro-viewport';

export type MicroAppName = 'vue-child' | 'react-child';

export interface MicroAppManifest {
  name: MicroAppName;
  title: string;
  routePath: string;
  envEntryKey: string;
  devEntry: string;
  containerId: string;
  basename: string;
}

export const MICRO_APP_MANIFESTS: readonly MicroAppManifest[] = [
  {
    name: 'vue-child',
    title: 'Vue 子应用',
    routePath: '/vue/*',
    envEntryKey: 'VITE_VUE_ENTRY',
    devEntry: 'http://localhost:3001/',
    containerId: MICRO_APP_CONTAINER_ID,
    basename: '/vue',
  },
  {
    name: 'react-child',
    title: 'React 子应用',
    routePath: '/react/*',
    envEntryKey: 'VITE_REACT_ENTRY',
    devEntry: 'http://localhost:3002/',
    containerId: MICRO_APP_CONTAINER_ID,
    basename: '/react',
  },
] as const;

export interface MicroAppRuntimeProps {
  basename: string;
  container?: HTMLElement;
  hostBase: string;
  appName: MicroAppName;
  theme: 'dark' | 'light';
}

export const MFE_ROOT_CLASS = 'mfe-shell';
export const MFE_VIEWPORT_CLASS = 'mfe-viewport';
export const MFE_REACT_CHILD_CLASS = 'mfe-app-react-child';
export const MFE_VUE_CHILD_CLASS = 'mfe-app-vue-child';
