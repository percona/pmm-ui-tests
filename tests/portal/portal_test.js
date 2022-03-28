const assert = require('assert');

require('dotenv').config();

Feature('Portal Integration with PMM');
let newUser = {};

Before(async ({
  I, pmmSettingsPage,
}) => {
  await I.Authorize();
  pmmSettingsPage.openAdvancedSettings();
  const publicAddress = await I.grabValueFrom(pmmSettingsPage.fields.publicAddressInput);

  if (publicAddress.length !== 0) pmmSettingsPage.clearPublicAddress();

  pmmSettingsPage.addPublicAddress();
});

After(async ({ I, pmmSettingsPage }) => {
  I.amOnPage(pmmSettingsPage.perconaPlatform);
  await pmmSettingsPage.disconnectPmmFromPerconaPortal();
  const users = await I.listUsers();
  const result = users.users.filter((user) => user.email === newUser.email);

  await I.deleteUser(result[0].id);
});

Scenario(
  'PMM-T1097 Verify PMM server is connected to Portal and PMM-T1098 Verify login using Percona Platform account',
  async ({
    I, pmmSettingsPage, portalAPI, homePage,
  }) => {
    newUser = await portalAPI.getUser();
    await portalAPI.oktaCreateUser(newUser);
    const userToken = await portalAPI.getUserAccessToken(newUser.email, newUser.password);

    await portalAPI.apiCreateOrg(userToken);
    I.amOnPage(pmmSettingsPage.perconaPlatform);
    await pmmSettingsPage.connectPmmToPerconaPortal(newUser.email, newUser.password);
    await homePage.open();
    await I.UnAuthorize();
    I.refreshPage();
    await I.LoginWithSSO(newUser.email, newUser.password);

    I.waitInUrl('/graph/d/pmm-home/home-dashboard?orgId=1&refresh=1m');
  },
);
