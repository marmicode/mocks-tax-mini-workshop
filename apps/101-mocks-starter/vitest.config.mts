import { playwright } from '@vitest/browser-playwright';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      name: '101-mocks-starter',
      watch: false,
      globals: true,
      browser: {
        enabled: true,
        screenshotFailures: false,
        headless: true,
        provider: playwright(),
        instances: [{ browser: 'chromium' }],
      },
      include: ['{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      setupFiles: ['src/test-setup.ts'],
      reporters: ['default'],
      coverage: {
        reportsDirectory: '../../coverage/apps/101-mocks-starter',
        provider: 'v8',
      },
    },
  }),
);
