import { defineConfig } from '@playwright/test';

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  forbidOnly: Boolean(process.env['CI']),
  outputDir: 'test-results',
  reporter: [['list'], ['html', { open: 'never' }]],
  testDir: './tests/e2e',
  timeout: 45_000,
  use: {
    actionTimeout: 10_000,
    channel: process.env['PLAYWRIGHT_CHROMIUM_CHANNEL'] ?? 'chrome',
    headless: true,
    trace: 'retain-on-failure',
  },
  workers: 1,
});
