const assert = require('assert');

const { I } = inject();

module.exports = {
  checkNames: {
    mysqlVersion: 'mysql_version',
    mysqlEmptyPassword: 'mysql_security_1',
  },

  async waitForCallbackWithTimeout(cb, timeout = 30) {
    let result = [];

    for (let i = 0; i < timeout; i++) {
      result = await cb();

      if (result && result.length) {
        return;
      }

      I.wait(1);
    }

    assert.fail('Timed out waiting.');
  },

  /* Since Enabling STT checks clears existing Checks Results,
   this method is used for waiting for results with a timeout */
  async waitForSecurityChecksResults(timeout) {
    await this.waitForCallbackWithTimeout(this.getSecurityChecksResults, timeout);
  },

  async getSecurityChecksResults() {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const resp = await I.sendPostRequest('v1/management/SecurityChecks/GetCheckResults', {}, headers);

    assert.ok(
      resp.status === 200,
      `Failed to get Security Checks results. Response message is "${resp.data.message}"`,
    );

    return resp.data.results;
  },

  async startSecurityChecks() {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const resp = await I.sendPostRequest('v1/management/SecurityChecks/Start', {}, headers);

    assert.ok(
      resp.status === 200,
      `Failed to start Security Checks. Response message is "${resp.data.message}"`,
    );
  },

  async verifyFailedCheckNotExists(detailsText, serviceName) {
    const failedCheckDoesNotExist = await this.getFailedCheckBySummary(detailsText, serviceName);

    assert.ok(!failedCheckDoesNotExist, `Expected "${detailsText}" failed check to not be present`);
  },

  async verifyFailedCheckExists(detailsText, serviceName) {
    const failedCheckExists = await this.getFailedCheckBySummary(detailsText, serviceName);

    assert.ok(failedCheckExists, `Expected to have "${detailsText}" failed check.`);
  },

  async getFailedCheckBySummary(summaryText) {
    const results = await this.getSecurityChecksResults();

    // return null if there are no failed checks
    if (!results) return null;

    return results.find((obj) => obj.summary.trim() === summaryText);
  },

  async enableCheck(checkName) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const body = {
      params: [{
        name: checkName,
        enable: true,
      }],
    };

    const resp = await I.sendPostRequest('v1/management/SecurityChecks/Change', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to change Security Checks results. Response message is "${resp.data.message}"`,
    );
  },

  async disableCheck(checkName) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const body = {
      params: [{
        name: checkName,
        disable: true,
      }],
    };

    const resp = await I.sendPostRequest('v1/management/SecurityChecks/Change', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to disable Security Check "${checkName}". Response message is "${resp.data.message}"`,
    );
  },

  async changeCheckInterval(checkName, interval = 'FREQUENT') {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const body = {
      params: [{
        name: checkName,
        interval,
      }],
    };

    const resp = await I.sendPostRequest('v1/management/SecurityChecks/Change', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to Change Check Interval. Response message is "${resp.data.message}"`,
    );
  },

  async getAllChecksList() {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const resp = await I.sendPostRequest('v1/management/SecurityChecks/List', {}, headers);

    return resp.data.checks;
  },

  async restoreDefaultIntervals() {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const body = {
      params: [],
    };

    await this.waitForCallbackWithTimeout(this.getAllChecksList, 60);
    const allChecks = await this.getAllChecksList();

    allChecks.forEach(({ name }) => body.params.push({ name, interval: 'STANDARD' }));
    const resp = await I.sendPostRequest('v1/management/SecurityChecks/Change', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to Change Check Interval. Response message is "${resp.data.message}"`,
    );
  },
};
