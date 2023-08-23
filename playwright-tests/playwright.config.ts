import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import Wait from '@helpers/enums/wait';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
dotenv.config();
dotenv.config({ path: '.env.local' });

const config: PlaywrightTestConfig = {
  testDir: './tests',
  timeout: Wait.FiveMinutes,
  expect: { timeout: Wait.TenSeconds },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: './playwright-report' }],
  ],

  use: {
    navigationTimeout: 30_000,
    baseURL: process.env.PMM_UI_URL || 'https://localhost',
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
  },
  projects: [
    {
      name: 'Chromium',
      testMatch: 'tests/**/*.spec.ts',
      testIgnore: 'tests/portal/*.ts',
      use: {
        contextOptions: { ignoreHTTPSErrors: true },
        screenshot: 'on',
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'Portal Setup',
      testMatch: 'tests/portal/testUsers.setup.ts',
    },
    {
      name: 'Portal',
      dependencies: ['Portal Setup'],
      testMatch: 'tests/portal/*.spec.ts',
      retries: 0,
      use: {
        contextOptions: { ignoreHTTPSErrors: true },
        screenshot: 'on',
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
};

export default config;
