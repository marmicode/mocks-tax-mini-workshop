import { playwright } from '@vitest/browser-playwright';
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

const browserTestPatterns = ['src/**/!(*.wide).test.ts'];
/* Wide tests talk to the real backend: start it with `nx start server`. */
const wideTestPatterns = ['src/**/*.wide.test.ts'];

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      setupFiles: ['src/test-setup.ts'],
      reporters: ['default'],
      coverage: {
        reportsDirectory: '../../coverage/apps/201-fake-solution',
        provider: 'v8',
      },
      watch: false,
      projects: [
        {
          extends: true,
          test: {
            name: 'browser',
            include: browserTestPatterns,
            browser: {
              enabled: true,
              screenshotFailures: false,
              headless: true,
              provider: playwright(),
              instances: [{ browser: 'chromium' }],
            },
          },
        },
        {
          extends: true,
          test: {
            name: 'wide',
            environment: 'jsdom',
            include: wideTestPatterns,
          },
        },
      ],
    },
  }),
);
