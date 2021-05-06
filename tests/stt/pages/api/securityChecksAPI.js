const assert = require('assert');

const { I } = inject();

module.exports = {
  checkNames: {
    mysqlVersion: 'mysql_version',
    mysqlEmptyPassword: 'mysql_empty_password',
  },

  /* Since Enabling STT checks clears existing Checks Results,
   this method is used for waiting for results with a timeout */
  async waitForSecurityChecksResults(timeout) {
    for (let i = 0; i < timeout; i++) {
      const results = await this.getSecurityChecksResults();

      if (results && results.length) {
        break;
      }

      I.wait(1);
    }
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
    // Verify there is no MySQL user empty password failed check
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

    return results.find((obj) => obj.summary === summaryText);
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

  async restoreDefaultIntervals() {
    const headers = { Authorization: `Basic ${await I.getAuth()}` };
    const body = {
      params: [{
        name: 'mongodb_version',
        interval: 'STANDARD',
      },
      {
        name: 'mysql_anonymous_users',
        interval: 'STANDARD',
      },
      {
        name: 'postgresql_super_role',
        interval: 'STANDARD',
      },
      {
        name: 'mysql_empty_password',
        interval: 'STANDARD',
      },
      {
        name: 'mysql_version',
        interval: 'STANDARD',
      },
      {
        name: 'mongodb_cve_version',
        interval: 'STANDARD',
      },
      {
        name: 'postgresql_version',
        interval: 'STANDARD',
      },
      {
        name: 'mongodb_auth',
        interval: 'STANDARD',
      },
      ],
    };

    const resp = await I.sendPostRequest('v1/management/SecurityChecks/Change', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to Change Check Interval. Response message is "${resp.data.message}"`,
    );
  },
};
