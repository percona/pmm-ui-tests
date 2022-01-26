const assert = require('assert');

const { I } = inject();

module.exports = {
  checkNames: {
    mysqlVersion: 'mysql_version',
    mysqlEmptyPassword: 'mysql_security_1',
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

  async startSecurityChecks(checkNamesArray) {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const body = checkNamesArray ? { names: checkNamesArray } : {};

    const resp = await I.sendPostRequest('v1/management/SecurityChecks/Start', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to start Security Checks. Response message is "${resp.data.message}"`,
    );
  },

  async verifyFailedCheckNotExists(detailsText, serviceName) {
    const failedCheckDoesNotExist = await this.getFailedCheckBySummary(detailsText, serviceName);

    assert.ok(!failedCheckDoesNotExist, `Expected "${detailsText}" failed check to not be present`);
  },

  async waitForFailedCheckExistance(detailsText, serviceName, timeout = 120) {
    await I.asyncWaitFor(async () => await this.getFailedCheckBySummary(detailsText, serviceName), timeout);
    I.wait(5);
  },

  async waitForFailedCheckNonExistance(detailsText, serviceName, timeout = 120) {
    await I.asyncWaitFor(async () => {
      const check = await this.getFailedCheckBySummary(detailsText, serviceName);

      return !check;
    }, timeout);
    I.wait(5);
  },

  async verifyFailedCheckExists(detailsText, serviceName) {
    const failedCheckExists = await this.getFailedCheckBySummary(detailsText, serviceName);

    assert.ok(failedCheckExists, `Expected to have "${detailsText}" failed check.`);
  },

  async getFailedCheckBySummary(summaryText, serviceName) {
    const results = await this.getSecurityChecksResults();

    // return null if there are no failed checks
    if (!results) return null;

    // eslint-disable-next-line max-len
    return results.find((obj) => obj.summary.trim() === summaryText && (serviceName ? obj.service_name.trim() === serviceName : true));
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

    await I.asyncWaitFor(this.getAllChecksList, 60);
    const allChecks = await this.getAllChecksList();

    allChecks.forEach(({ name }) => body.params.push({ name, interval: 'STANDARD' }));
    const resp = await I.sendPostRequest('v1/management/SecurityChecks/Change', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to Change Check Interval. Response message is "${resp.data.message}"`,
    );
  },
};
