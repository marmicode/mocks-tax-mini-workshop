import { playwright } from '@vitest/browser-playwright';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      name: '102-fakes-starter',
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
        reportsDirectory: '../../coverage/apps/102-fakes-starter',
        provider: 'v8',
      },
    },
  }),
);
