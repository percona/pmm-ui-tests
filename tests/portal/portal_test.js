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
  pmmSettingsPage.openAdvancedSettings();
  pmmSettingsPage.clearPublicAddress();
  console.log('We are done');
  console.log(`And Test ran for user: ${newUser.email}, with password: ${newUser.password}`);
});

Scenario(
  'PMM-T1097 Verify PMM server is connected to Portal and PMM-T1098 Verify login using Percona Platform account',
  async ({
    I, pmmSettingsPage, portalAPI,
  }) => {
    // eslint-disable-next-line no-console
    console.log('Running Test for Free User');
    // newUser = await portalAPI.getUser();

    // eslint-disable-next-line no-console
    console.log('Running Test for Customer');
    const serviceNowUsers = await portalAPI.createServiceNowUsers();

    newUser = serviceNowUsers.admin1;
    await portalAPI.oktaCreateUser(newUser);
    const userToken = await portalAPI.getUserAccessToken(newUser.email, newUser.password);
    const responseCompany = await portalAPI.searchCompany(userToken);

    await portalAPI.apiCreateOrg(userToken, responseCompany.name);
    I.amOnPage(pmmSettingsPage.perconaPlatform);
    pmmSettingsPage.connectPmmToPerconaPortal(newUser.email, newUser.password);
    I.UnAuthorize();
    // I.wait(60);
  },
);
