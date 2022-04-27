const { pageObjects, getChunks } = require('./codeceptConfigHelper');

process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

exports.config = {
  output: 'tests/output',
  helpers: {
    Playwright: {
      url: process.env.PMM_UI_URL || 'http://127.0.0.1/',
      restart: true,
      browser: 'chromium',
      windowSize: '1920x1080',
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
    Grafana: {
      require: './tests/helper/grafana_helper.js',
      username: process.env.GRAFANA_USERNAME,
      password: process.env.GRAFANA_PASSWORD,
    },
    FileHelper: {
      require: './tests/helper/file_helper.js',
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
    ChaiWrapper: {
      require: 'codeceptjs-chai',
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
  timeout: 1800,
  name: 'pmm-qa',
};
