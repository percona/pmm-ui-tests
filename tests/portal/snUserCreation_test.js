const util = require('util');
const exec = util.promisify(require('child_process').exec);

Feature('Create Credentials for Service Now Users');

Scenario(
  'Prepare credentials for PMM-Portal @service-now-users',
  async ({
    I, portalAPI,
  }) => {
    const portalCredentials = await portalAPI.createServiceNowUsers();

    I.say(`Admin email is: ${portalCredentials.admin1.email}`);
    const AdminReponse1 = await I.verifyCommand(`SERVICE_NOW_ADMIN_USERNAME=${portalCredentials.admin1.email}`);

    I.say(AdminReponse1);
    const AdminReponse2 = await I.verifyCommand('echo $SERVICE_NOW_ADMIN_USERNAME');

    I.say(AdminReponse2);
    I.say(JSON.stringify(await exec('echo $SERVICE_NOW_ADMIN_USERNAME')));
    I.say(await exec(`SERVICE_NOW_ADMIN_PASSWORD=${portalCredentials.admin1.password}`));
    I.say(JSON.stringify(await exec('echo $SERVICE_NOW_ADMIN_PASSWORD')));
    I.say(await exec(`SERVICE_NOW_TECHNICAL_USERNAME=${portalCredentials.technical.email}`));
    I.say(JSON.stringify(await exec('echo $SERVICE_NOW_ADMIN_USERNAME')));
    I.say(await exec(`SERVICE_NOW_TECHNICAL_PASSWORD=${portalCredentials.technical.password}`));
    I.say(JSON.stringify(await exec('echo $SERVICE_NOW_ADMIN_PASSWORD')));
    await I.wait(5);
  },
);
