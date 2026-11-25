import { defineConfig, devices } from '@playwright/test';

// Several worktrees may run tests at once, so each checkout gets its own
// server port, derived from its path (override with TEST_PORT).
function portForCheckout() {
  let h = 0;
  for (const c of process.cwd()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return 8200 + (h % 700);
}
const PORT = Number(process.env.TEST_PORT) || portForCheckout();

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  workers: 2,
  use: {
    baseURL: `http://localhost:${PORT}/`,
    viewport: { width: 768, height: 672 },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 672 } }, testIgnore: /mobile\.spec\.js/ },
    { name: 'phone', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec\.js/ },
  ],
  webServer: {
    command: `node tests/serve.js ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
  },
});
