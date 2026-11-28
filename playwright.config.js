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
    // Safari: desktop WebKit for the full suite, and an iPhone profile for touch.
    { name: 'webkit', use: { ...devices['Desktop Safari'], viewport: { width: 768, height: 672 } }, testIgnore: /mobile\.spec\.js/ },
    { name: 'iphone', use: { ...devices['iPhone 13'] }, testMatch: /mobile\.spec\.js/ },
    // The story playthroughs again in the isometric view (the view is
    // remembered in localStorage, so every page starts in it).
    {
      name: 'iso',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 672 },
        screenshot: 'only-on-failure',
        storageState: { cookies: [], origins: [{ origin: `http://localhost:${PORT}`, localStorage: [{ name: 'moonshine.view', value: 'iso' }] }] },
      },
      testMatch: /(opening|act[2-6])\.spec\.js/,
    },
  ],
  webServer: {
    command: `node tests/serve.js ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
  },
});
