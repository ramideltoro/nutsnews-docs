import { defineConfig } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4321';
const webServerCommand = process.env.WIKI_PLAYWRIGHT_SERVER_COMMAND
  || 'npm run build && npm run preview -- --host 127.0.0.1 --port 4321';

export default defineConfig({
  testDir: './tests/wiki',
  outputDir: './test-results/wiki',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.05,
      scale: 'css',
      threshold: 0.25,
    },
  },
  reporter: process.env.CI
    ? [['line'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  snapshotPathTemplate: '{testDir}/{testFilePath}-snapshots/{arg}-{projectName}-{platform}{ext}',
  use: {
    baseURL,
    browserName: 'chromium',
    colorScheme: 'dark',
    locale: 'en-US',
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: webServerCommand,
    url: `${baseURL}/simple/project/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'desktop-1440x1024',
      use: { viewport: { width: 1440, height: 1024 } },
    },
    {
      name: 'tablet-834x1194',
      use: { viewport: { width: 834, height: 1194 } },
    },
    {
      name: 'mobile-390x844',
      use: { viewport: { width: 390, height: 844 } },
    },
  ],
});
