import { defineConfig } from '@playwright/test';

// An isolated work copy can test on its own port (TRAINLEAF_E2E_PORT) without touching a shared preview.
const port = Number(process.env.TRAINLEAF_E2E_PORT || 4174);
const baseURL = `http://127.0.0.1:${port}`;
/** The earlier specs assert Polish texts; they start with Polish saved as the chosen language. */
const polish = { cookies: [], origins: [{ origin: baseURL, localStorage: [{ name: 'trainleaf-language', value: 'pl' }] }] };

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: 'list',
  outputDir: '../test-results/mobile',
  use: { baseURL, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', actionTimeout: 15_000, trace: 'retain-on-failure' },
  projects: [
    // The patterns match the file name only; a checkout directory may itself contain "i18n".
    { name: 'polish-regression', testIgnore: /[\\/]localisation[^\\/]*\.spec\.ts$/, use: { storageState: polish } },
    // Localisation specs start without any saved language, exactly like a fresh installation.
    { name: 'localisation', testMatch: /[\\/]localisation[^\\/]*\.spec\.ts$/ },
  ],
  webServer: {
    command: `npm run mobile:preview -- --port ${port}`,
    cwd: '..',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
