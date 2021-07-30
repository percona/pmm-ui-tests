const { I } = inject();
const assert = require('assert');

module.exports = {
  async startBackup(name, service_id, location_id) {
    const body = {
      service_id,
      location_id,
      name,
      description: '',
    };

    const headers = { Authorization: `Basic ${await I.getAuth()}` };

    const resp = await I.sendPostRequest('v1/management/backup/Backups/Start', body, headers);

    assert.ok(
      resp.status === 200,
      `Failed to start a backup "${name}". Response message is "${resp.data.message}"`,
    );

    return resp.data.artifact_id;
  },
};
