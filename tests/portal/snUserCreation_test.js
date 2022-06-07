const util = require('util');
const exec = util.promisify(require('child_process').exec);

Feature('Create Credentials for Service Now Users');

Scenario(
  'Prepare credentials for PMM-Portal @service-now-users',
  async ({
    I, portalAPI,
  }) => {
    const portalCredentials = await portalAPI.createServiceNowUsers();

    await exec(`export SERVICE_NOT_ADMIN_USERNAME=${portalCredentials.admin1.email}`);
  },
);
