const util = require('util');
const exec = util.promisify(require('child_process').exec);

Feature('Create Credentials for Service Now Users');

Scenario(
  'Prepare credentials for PMM-Portal @service-now-users',
  async ({
    I, portalAPI,
  }) => {
    const portalCredentials = await portalAPI.createServiceNowUsers();

    I.say(await exec(`SERVICE_NOW_ADMIN_USERNAME=${portalCredentials.admin1.email}`));
    I.say(JSON.stringify(await exec('echo $SERVICE_NOW_ADMIN_USERNAME')));
    I.say(await exec(`SERVICE_NOW_ADMIN_PASSWORD=${portalCredentials.admin1.password}`));
    I.say(JSON.stringify(await exec('echo $SERVICE_NOW_ADMIN_PASSWORD')));
    await I.wait(5);
  },
);
