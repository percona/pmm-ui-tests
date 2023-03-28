import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import Duration from './helpers/Duration';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */

dotenv.config({ path: '.env.local' });
dotenv.config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: './tests',
  timeout: Duration.TenMinutes,
  expect: {
    timeout: 5000,
  },

  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['github'],
    ['list'],
    ['html', { open: 'never' }]
  ],

  use: {
    navigationTimeout: 30 * 1000,
    baseURL: process.env.PMM_BASE_URL || 'http://localhost',
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    video: 'on',
    actionTimeout: 15 * 1000,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      testDir: `./tests`,
      use: {
        contextOptions: {
          ignoreHTTPSErrors: true,
        },
        screenshot: 'on',
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
};

export default config;
