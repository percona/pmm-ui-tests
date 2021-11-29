const { setHeadlessWhen } = require('@codeceptjs/configure');

const { pageObjects, getChunks } = require('./codeceptConfig');

require('dotenv').config();

// by default run in headless mode
setHeadlessWhen(!(process.env.SHOW_BROWSER === 'true'));

exports.config = {
  output: 'tests/output',
  helpers: {
    Playwright: {
      trace: true,
      show: true,
      url: process.env.PMM_UI_URL || 'http://127.0.0.1/',
      restart: false,
      browser: 'chromium',
      windowSize: '1920x1080',
      waitForNavigation: 'load',
      waitForTimeout: 3000,
      getPageTimeout: 3000,
      waitForAction: 100,
      pressKeyDelay: 0,
      chromium: {
        executablePath: process.env.CHROMIUM_PATH,
        ignoreHTTPSErrors: true,
        args: [
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
    Grafana: {
      require: './tests/helper/grafana_helper.js',
      username: process.env.GRAFANA_USERNAME,
      password: process.env.GRAFANA_PASSWORD,
    },
    REST: {
      endpoint: process.env.PMM_UI_URL || 'http://127.0.0.1/',
      timeout: 30000,
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
        stdout: './tests/output/console.log',
        options: {
          mochaFile: './tests/output/result.xml',
        },
      },
      mochawesome: {
        stdout: './tests/output/mocharesult.log',
        options: {
          reportDir: './tests/output',
          reportFilename: 'result.html',
        },
      },
    },
  },
  bootstrap: false,
  teardown: null,
  hooks: [],
  gherkin: {},
  tests: 'tests/**/*_test.js',
  timeout: 10000,
  name: 'pmm-qa',
};
