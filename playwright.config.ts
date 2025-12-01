import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: [
    {
      command: 'cd apps/web && yarn dev',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd apps/api && yarn dev',
      port: 4000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
