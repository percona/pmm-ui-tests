#!/usr/bin/env node

const { Workers, event } = require('codeceptjs');

const workerConfig = {
  testConfig: './codecept.conf.js',
};

const workers = new Workers(null, workerConfig);
const testGroups = workers.createGroupsOfSuites(2);

const browsers = ['chromium'];

const configs = browsers.map(browser => {
  return {
    helpers: {
      Playwright: { browser }
    }
  };
});

for (const config of configs) {
  for (group of testGroups) {
    const worker = workers.spawn();
    worker.addTests(group);
    worker.addConfig(config);
  }
}

// Listen events for failed test
workers.on(event.test.failed, (failedTest) => {
  console.log('Failed : ', failedTest.title);
});

// Listen events for passed test
workers.on(event.test.passed, (successTest) => {
  console.log('Passed : ', successTest.title);
});

// test run status will also be available in event
workers.on(event.all.result, () => {
  // print output
  console.log('Test status : ', status ? 'Passes' : 'Failed ');

  // print stats
  console.log(`Total tests : ${workerStats.tests}`);
  console.log(`Passed tests : ${workerStats.passes}`);
  console.log(`Failed test tests : ${workerStats.failures}`);

  // If you don't want to listen for failed and passed test separately, use completedTests object
  for (const test of Object.values(completedTests)) {
    console.log(`Test status: ${test.err===null}, `, `Test : ${test.title}`);
  }
});

// run workers as async function
runWorkers();

async function runWorkers() {
  try {
    // run bootstrapAll
    await workers.bootstrapAll();
    // run tests
    await workers.run();
  } finally {
    // run teardown All
    await workers.teardownAll();
  }
}