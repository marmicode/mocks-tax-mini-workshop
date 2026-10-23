import { playwright } from '@vitest/browser-playwright';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';
import { RECIPE_API_PORT } from './vitest.global-setup';

export default mergeConfig(
  viteConfig,
  defineConfig({
    server: {
      /* Let the recipe repository reach the test recipe API. */
      proxy: {
        '/api': `http://localhost:${RECIPE_API_PORT}`,
      },
    },
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
      globalSetup: ['vitest.global-setup.ts'],
      reporters: ['default'],
      coverage: {
        reportsDirectory: '../../coverage/apps/102-fakes-starter',
        provider: 'v8',
      },
    },
  }),
);
