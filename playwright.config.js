import { defineConfig, devices } from '@playwright/test';

// The test server's port: $PORT, or one picked from this checkout's path so
// several worktrees can run their tests at the same time.
const pathHash = [...process.cwd()].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
const port = Number(process.env.PORT || 8131 + (pathHash % 400));

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  workers: 2,
  use: {
    baseURL: `http://localhost:${port}/`,
    viewport: { width: 768, height: 672 },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 672 } }, testIgnore: /mobile\.spec\.js/ },
    { name: 'phone', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec\.js/ },
  ],
  webServer: {
    command: `node tests/serve.js ${port}`,
    url: `http://localhost:${port}/`,
    reuseExistingServer: false,
  },
});
