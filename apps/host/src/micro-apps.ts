import { MICRO_APP_MANIFESTS, type MicroAppRuntimeProps } from '@mfe/shared';
import { registerMicroApps, start } from 'qiankun';

let qiankunStarted = false;

const MICRO_APP_LOADING_EVENT = 'mfe:micro-app-loading';

function normalizeBase(base: string) {
  const normalized = base.replace(/\/$/, '');
  return normalized === '' ? '' : normalized;
}

function joinBasePath(base: string, path: string) {
  return `${normalizeBase(base)}/${path.replace(/^\//, '')}`;
}

function getEnvUrl(key: string, fallback: string) {
  const value = import.meta.env[key] as string | undefined;
  return value && value.trim().length > 0 ? value : fallback;
}

function dispatchLoading(name: string, loading: boolean) {
  window.dispatchEvent(
    new CustomEvent(MICRO_APP_LOADING_EVENT, {
      detail: { name, loading },
    }),
  );
}

export function subscribeMicroAppLoading(
  listener: (detail: { name: string; loading: boolean }) => void,
) {
  const handler = (event: Event) => {
    listener((event as CustomEvent<{ name: string; loading: boolean }>).detail);
  };

  window.addEventListener(MICRO_APP_LOADING_EVENT, handler);
  return () => window.removeEventListener(MICRO_APP_LOADING_EVENT, handler);
}

export function startQiankun() {
  if (qiankunStarted) return;
  qiankunStarted = true;

  const hostBase = normalizeBase(import.meta.env.BASE_URL);

  registerMicroApps(
    MICRO_APP_MANIFESTS.map((app) => {
      const activePath = joinBasePath(hostBase, app.basename);

      return {
        name: app.name,
        entry: getEnvUrl(app.envEntryKey, app.devEntry),
        container: `#${app.containerId}`,
        activeRule: activePath,
        loader: (loading: boolean) => dispatchLoading(app.name, loading),
        props: {
          appName: app.name,
          basename: activePath,
          hostBase,
          theme: 'dark',
        } satisfies Omit<MicroAppRuntimeProps, 'container'>,
      };
    }),
  );

  start({
    sandbox: {
      experimentalStyleIsolation: true,
    },
    prefetch: import.meta.env.DEV ? false : 'all',
  });
}
