const assert = require('assert');
const portalAPI = require('../pages/api/portalAPI');

Feature('Testing PMM connected to the Portal Upgrade tests');
const fileName = 'portalCredentials';
let portalCredentials = [];

BeforeSuite(async ({ I }) => {
  const userCredentials = String(await I.readFileSync(fileName));

  if (userCredentials.length > 0) {
    portalCredentials = JSON.parse(userCredentials);
  } else {
    portalCredentials = await portalAPI.createServiceNowUsers();
    portalAPI.oktaCreateUser(portalCredentials.admin1);
    portalAPI.oktaCreateUser(portalCredentials.admin2);
    portalAPI.oktaCreateUser(portalCredentials.technical);
    await I.writeFileSync(fileName, JSON.stringify(portalCredentials));
  }
});

AfterSuite(async ({ I }) => {
  I.writeFileSync(fileName, '');
});

Scenario('Verify ServiceNow user can connect to PMM Server @pre-pmm-portal-upgrade',
  async ({
    I, pmmSettingsPage, perconaPlatformPage,
  }) => {
    await I.Authorize();
    pmmSettingsPage.openAdvancedSettings();
    const publicAddress = await I.grabValueFrom(pmmSettingsPage.fields.publicAddressInput);

    if (publicAddress.length !== 0) pmmSettingsPage.clearPublicAddress();

    pmmSettingsPage.addPublicAddress();
    perconaPlatformPage.openPerconaPlatform();
    const adminToken = await portalAPI.getUserAccessToken(portalCredentials.admin1.email, portalCredentials.admin1.password);

    console.log(adminToken);
  });
/*
Scenario(
  'Verify All org users can login in connected PMM server @pre-pmm-portal-upgrade @post-pmm-portal-upgrade',
  async ({
    I, homePage,
  }) => {
    I.amOnPage('');
    await I.loginWithSSO(portalCredentials.admin1.email, portalCredentials.admin2.password);
    I.click('//input[@id="okta-signin-submit"]');
    I.waitInUrl(homePage.landingUrl);
    I.unAuthorize();
    await I.loginWithSSO(portalCredentials.admin2.email, portalCredentials.admin2.password);
    I.click('//input[@id="okta-signin-submit"]');
    I.waitInUrl(homePage.landingUrl);
    I.unAuthorize();
    await I.loginWithSSO(portalCredentials.technical.email, portalCredentials.technical.password);
    I.click('//input[@id="okta-signin-submit"]');
    I.waitInUrl(homePage.landingUrl);
    I.unAuthorize();
  },
);
*/
Scenario(
  'Verify user roles are untouched after PMM server upgrade @post-pmm-portal-upgrade',
  async ({
    I, remoteInstancesPage,
  }) => {
    const users = await I.listUsers();
    const foundAdmin1User = users.users.find((user) => user.email === 'admin@localhost');

    // eslint-disable-next-line no-console
    console.log(portalCredentials);
    assert.ok(foundAdmin1User.isAdmin === true, `User role for the user ${foundAdmin1User.login} was changed from admin to viewer`);
  },
);
/*
Scenario(
  'Verify PMM server is connected to the Portal @pre-pmm-portal-upgrade @post-pmm-portal-upgrade',
  async ({
    I, perconaPlatformPage,
  }) => {
    I.Authorize();
    I.amOnPage('');
    perconaPlatformPage.openPerconaPlatform();
    console.log('Hello World');
  },
);

Scenario(
  'Verify User can disconnect an reconect PMM server to the Portal @pre-pmm-portal-upgrade @post-pmm-portal-upgrade',
  async ({
    I, perconaPlatformPage,
  }) => {
    I.Authorize();
    I.amOnPage('');
    perconaPlatformPage.openPerconaPlatform();
    console.log('Hello World');
  },
);
*/
