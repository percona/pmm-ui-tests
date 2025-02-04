class ReporterHelper extends Helper {
  // eslint-disable-next-line no-underscore-dangle
  async _afterSuite(suite) {
    console.log(`CI variable is: ${process.env.CI}`);

    if (process.env.CI) {
      const testCycleKey = process.env.ZEPHYR_TEST_CYCLE_KEY || 'PMM-R196';

      for await (const test of suite.tests) {
        const testCaseKey = test.title.split(' - ')[0];
        let statusName;
        let resp;

        if (test.state === 'failed') {
          statusName = 'FAIL';
        } else if (test.state === 'passed') {
          statusName = 'PASS';
        }

        if (statusName) {
          resp = await this.helpers.REST.sendPostRequest(
            'https://api.zephyrscale.smartbear.com/v2/testexecutions',
            {
              projectKey: 'PMM',
              testCaseKey,
              testCycleKey,
              statusName,
            },
            { Authorization: `Bearer ${process.env.ZEPHYR_PMM_API_KEY}` },
          );
        }

        if (resp && (resp.status === 200 || resp.status === 201)) {
          console.log(`Successfully uploaded test results for the test: "${testCaseKey}" into test cycle: "${testCycleKey}".`);
        } else if (resp && resp.status >= 400) {
          console.log(`Error while uploading tests result for the test: "${testCaseKey}". Error code: "${resp.status}" with message: "${resp.statusText}"`);
        }
      }
    }
  }
}

module.exports = ReporterHelper;
