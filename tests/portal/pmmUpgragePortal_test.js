const assert = require('assert');
const portalAPI = require('../pages/api/portalAPI');

Feature('Testing PMM connected to the Portal Upgrade tests');
// let adminToken = '';
const fileName = 'portalCredentials';

// let portalCredentials = {};
/*
BeforeSuite(async ({ I }) => {
  const userCredentials = await I.readFileSync(fileName, true);

  if (userCredentials !== null && userCredentials.length > 0) {
    portalCredentials = JSON.parse(userCredentials);
  } else {
    portalCredentials = await portalAPI.createServiceNowUsers();
    portalAPI.oktaCreateUser(portalCredentials.admin1);
    portalAPI.oktaCreateUser(portalCredentials.admin2);
    portalAPI.oktaCreateUser(portalCredentials.technical);
    adminToken = await portalAPI.getUserAccessToken(portalCredentials.admin1.email, portalCredentials.admin1.password);
    const orgResp = await portalAPI.apiCreateOrg(adminToken);

    portalAPI.apiInviteOrgMember(adminToken, orgResp.id, { username: portalCredentials.admin2.email, role: 'Admin' });
    portalAPI.apiInviteOrgMember(adminToken, orgResp.id, { username: portalCredentials.technical.email, role: 'Technical' });
    await I.writeFileSync(fileName, JSON.stringify(portalCredentials), true);
  }
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
    await perconaPlatformPage.openPerconaPlatform();
    await perconaPlatformPage.connectToPortal(adminToken, `Test Server ${Date.now()}`);
  });

Scenario(
  'Verify All org users can login in connected PMM server @pre-pmm-portal-upgrade @post-pmm-portal-upgrade',
  async ({
    I, homePage,
  }) => {
    I.amOnPage('');
    await I.loginWithSSO(portalCredentials.admin1.email, portalCredentials.admin1.password);
    I.waitInUrl(homePage.landingUrl);
    I.unAuthorize();
    await I.loginWithSSO(portalCredentials.admin2.email, portalCredentials.admin2.password);
    I.waitInUrl(homePage.landingUrl);
    I.unAuthorize();
    await I.loginWithSSO(portalCredentials.technical.email, portalCredentials.technical.password);
    I.waitInUrl(homePage.landingUrl);
    I.unAuthorize();
  },
);

Scenario(
  'Verify user is able to Upgrade PMM version @pmm-portal-upgrade',
  async ({ I, homePage }) => {
    const { versionMinor } = homePage.getVersions();

    await I.Authorize();
    I.amOnPage(homePage.url);
    await homePage.upgradePMM(versionMinor);
  },
).retry(0);

Scenario(
  'Verify user roles are untouched after PMM server upgrade @post-pmm-portal-upgrade',
  async ({
    I,
  }) => {
    const users = await I.listOrgUsers();
    const foundAdmin1User = users.find((user) => user.email === portalCredentials.admin1.email);
    const foundAdmin2User = users.find((user) => user.email === portalCredentials.admin2.email);
    const foundTechnicalUser = users.find((user) => user.email === portalCredentials.technical.email);

    assert.ok(foundAdmin1User.role === 'Admin', `User role for the user ${foundAdmin1User.login} was changed.`);
    assert.ok(foundAdmin2User.role === 'Admin', `User role for the user ${foundAdmin2User.login} was changed.`);
    assert.ok(foundTechnicalUser.role === 'Viewer', `User role for the user ${foundTechnicalUser.login} was changed.`);
  },
);

Scenario(
  'Verify PMM is connecteda and user can disconnect an reconect PMM server to the Portal @post-pmm-portal-upgrade',
  async ({
    I, perconaPlatformPage, homePage,
  }) => {
    I.amOnPage('');
    I.loginWithSSO(portalCredentials.admin1.email, portalCredentials.admin1.password);
    I.waitInUrl(homePage.landingUrl);
    perconaPlatformPage.openPerconaPlatform();
    perconaPlatformPage.isPMMConnected();
    perconaPlatformPage.disconnectFromPortal();
    adminToken = await portalAPI.getUserAccessToken(portalCredentials.admin1.email, portalCredentials.admin1.password);
    perconaPlatformPage.connectToPortal(adminToken, `Test Server ${Date.now()}`);
  },
);

Scenario(
  'Verify User can disconnect PMM from the Portal @post-pmm-portal-upgrade',
  async ({
    I, perconaPlatformPage, homePage,
  }) => {
    I.amOnPage('');
    I.loginWithSSO(portalCredentials.admin1.email, portalCredentials.admin1.password);
    I.waitInUrl(homePage.landingUrl);
    perconaPlatformPage.openPerconaPlatform();
    perconaPlatformPage.isPMMConnected();
    perconaPlatformPage.disconnectFromPortal();
  },
);
*/
