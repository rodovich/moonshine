import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  workers: 2,
  use: {
    baseURL: 'http://localhost:8123/',
    viewport: { width: 768, height: 672 },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 672 } }, testIgnore: /mobile\.spec\.js/ },
    { name: 'phone', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec\.js/ },
  ],
  webServer: {
    command: 'node tests/serve.js 8123',
    url: 'http://localhost:8123/',
    reuseExistingServer: true,
  },
});
