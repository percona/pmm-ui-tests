const { pageObjects, getChunks } = require('./codeceptConfigHelper');

require('dotenv').config();

process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

exports.config = {
  output: 'tests/output',
  helpers: {
    Playwright: {
      url: process.env.PMM_UI_URL || 'http://127.0.0.1',
      restart: true,
      browser: 'chromium',
      windowSize: '1920x1080',
      timeout: 20000,
      waitForNavigation: 'networkidle0',
      waitForTimeout: 60000,
      getPageTimeout: 60000,
      waitForAction: 500,
      pressKeyDelay: 5,
      chromium: {
        executablePath: process.env.CHROMIUM_PATH,
        ignoreHTTPSErrors: true,
        args: [
          '--ignore-certificate-errors',
          '--no-sandbox',
          '--window-size=1920,1080',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-setuid-sandbox',
        ],
      },
    },
    MongoDBHelper: {
      require: './tests/helper/mongoDB.js',
      host: '127.0.0.1',
      port: 27017,
      username: 'root',
      password: 'root-!@#%^password',
    },
    PostgresqlDBHelper: {
      require: 'codeceptjs-postgresqlhelper',
      host: '127.0.0.1',
      port: 5433,
      user: 'postgres',
      password: 'pmm-^*&@agent-password',
      database: 'postgres',
    },
    Grafana: {
      require: './tests/helper/grafana_helper.js',
      username: process.env.GRAFANA_USERNAME,
      password: process.env.GRAFANA_PASSWORD,
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
    REST: {
      endpoint: process.env.PMM_UI_URL || 'http://127.0.0.1',
      timeout: 60000,
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
  include: pageObjects,
  multiple: {
    parallel: {
      chunks: (files) => getChunks(files),
      browsers: ['chromium'],
    },
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
    allure: {
      enabled: true,
      outputDir: 'tests/output/allure',
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
          steps: true,
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
  bootstrap: false,
  teardown: null,
  hooks: [],
  gherkin: {},
  tests: 'tests/**/*_test.js',
  timeout: 1800,
  name: 'pmm-qa',
};
