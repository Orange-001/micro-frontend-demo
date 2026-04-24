import { MICRO_APP_MANIFESTS, type MicroAppRuntimeProps } from '@mfe/shared';
import { registerMicroApps, start } from 'qiankun';

let qiankunStarted = false;

function normalizeBase(base: string) {
  const normalized = base.replace(/\/$/, '');
  return normalized === '' ? '' : normalized;
}

function getEnvUrl(key: string, fallback: string) {
  const value = import.meta.env[key] as string | undefined;
  return value && value.trim().length > 0 ? value : fallback;
}

export function startQiankun() {
  if (qiankunStarted) return;
  qiankunStarted = true;

  const hostBase = normalizeBase(import.meta.env.BASE_URL);

  registerMicroApps(
    MICRO_APP_MANIFESTS.map((app) => ({
      name: app.name,
      entry: getEnvUrl(app.envEntryKey, app.devEntry),
      container: `#${app.containerId}`,
      activeRule: `${hostBase}${app.basename}`,
      props: {
        appName: app.name,
        basename: app.basename,
        hostBase,
        theme: 'dark',
      } satisfies Omit<MicroAppRuntimeProps, 'container'>,
    })),
  );

  start({
    sandbox: {
      experimentalStyleIsolation: true,
    },
    prefetch: false,
  });
}
