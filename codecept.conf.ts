const { pageObjects, getChunks } = require('./codeceptConfigHelper');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

const pmmUrl = process.env.PMM_UI_URL ? process.env.PMM_UI_URL : 'http://65.108.252.32/';

export const config: CodeceptJS.MainConfig = {
  tests: './tests/*_test.*',
  output: './output',
  helpers: {
    Playwright: {
      browser: 'chromium',
      windowSize: '1920x1080',
      url: pmmUrl.replace(/\/(?!.*\/)$/gm, ''),
      show: false,
      chromium: {
        ignoreHTTPSErrors: true,
        args: [
          '--ignore-certificate-errors',
          '--no-sandbox',
          '--window-size=1920,1080',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-setuid-sandbox',
        ],
      }

    },
    REST: {
      endpoint: process.env.PMM_UI_URL || pmmUrl,
      timeout: 60000,
    },
  },
  include: {
    I: './steps_file',
    api: './api/api',
    ...pageObjects,
  },
  mocha: {
    reporterOptions: {
      'codeceptjs-cli-reporter': {
        stdout: '-',
        options: {
          verbose: false,
          steps: false,
        },
      },
      'mocha-junit-reporter': {
        stdout: '-',
        options: {
          mochaFile: './tests/output/result.xml',
          jenkinsMode: true,
        },
      },
    },
  },
  name: 'codeceptjs-poc'
}