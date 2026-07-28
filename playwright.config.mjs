import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
    timeout: 180_000,
    stderr: 'pipe',
    stdout: 'pipe',
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1024 },
      },
    },
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro'],
        viewport: { width: 834, height: 1194 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 12'],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
