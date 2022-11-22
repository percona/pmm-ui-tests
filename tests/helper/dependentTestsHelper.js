const Helper = codecept_helper;
const assert = require('assert');

class DependentTestsHelper extends Helper {
  async addPassedTC(tcNumber) {
    let passedTests;

    // process.env['PASSED_TESTS'] = '{ "passedTests": ["PMM-T1"] }';
    if (process.env.PASSED_TESTS) {
      passedTests = JSON.parse(process.env.PASSED_TESTS);
      passedTests.passedTests.push(tcNumber);
    } else {
      passedTests = { passedTests: [] };
      passedTests.passedTests.push(tcNumber);
    }

    // eslint-disable-next-line dot-notation
    process.env['PASSED_TESTS'] = JSON.stringify(passedTests);
  }

  async verifyDependedTestsPassed(tcNumber, dependencies) {
    const failedTests = [];
    const passedTests = JSON.parse(process.env.PASSED_TESTS);

    dependencies.forEach((dependency) => {
      if (!passedTests.passedTests.includes(dependency)) {
        failedTests.push(dependency);
      }
    });

    assert.ok(failedTests.length < 1, `Test ${tcNumber} Failed due to depended test and setup in test cases ${failedTests} failing.`);
  }
}

module.exports = DependentTestsHelper;
