import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import Duration from '@helpers/enums/Duration';

dotenv.config({ path: '.env.local' });
dotenv.config();

const config: PlaywrightTestConfig = {
  testDir: './tests',
  timeout: Duration.FiveMinutes,
  expect: {
    timeout: 10_000,
  },

  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['github'],
    ['list'],
    ['html', { open: 'never', outputFolder: './playwright-report' }]
  ],

  use: {
    navigationTimeout: 30_000,
    baseURL: process.env.PMM_BASE_URL || 'https://localhost',
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
    actionTimeout: 15_000,
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
