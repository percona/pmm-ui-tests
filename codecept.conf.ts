const { pageObjects, getChunks } = require('./codeceptConfigHelper');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

const pmmUrl = process.env.PMM_UI_URL ? process.env.PMM_UI_URL : 'http://65.108.252.32/';

export const config: CodeceptJS.MainConfig = {
  tests: './tests/**/*_test.*',
  output: 'tests/output',
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
    FileHelper: {
      require: './tests/helper/file_helper.js',
    },
    FileSystem: {},
    PerformanceHelper: {
      require: './tests/helper/performance_helper.js',
    },
    BrowserHelper: {
      require: './tests/helper/browser_helper.js',
    },
    Grafana: {
      require: './tests/helper/grafana_helper.js',
      username: process.env.GRAFANA_USERNAME,
      password: process.env.GRAFANA_PASSWORD,
    },
    Mailosaur: {
      require: 'codeceptjs-mailosaurhelper',
      apiKey: process.env.MAILOSAUR_API_KEY || 'key',
      serverId: process.env.MAILOSAUR_SERVER_ID || 'id',
      timeout: 15000,
    },
    DbHelper: {
      require: 'codeceptjs-dbhelper',
    },
    ChaiWrapper: {
      require: 'codeceptjs-chai',
    },
    LocalStorageHelper: {
      require: './tests/helper/localStorageHelper.js',
    },
    ApiHelper: {
      require: './tests/helper/apiHelper.js',
    },
  },
  include: {
    I: './steps_file',
    api: './api/api',
    ...pageObjects,
  },
  plugins: {
    autoDelay: {
      enabled: true,
    },
    customLocator: {
      enabled: true,
      strategy: 'css',
      attribute: 'data-testid',
      showActual: false,
    },
    tryTo: {
      enabled: true,
    },
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
  name: 'pmm-ui-tests'
}