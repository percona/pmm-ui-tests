const assert = require('assert');

Feature('Portal Integration with PMM');

const fileName = 'portalCredentials';
let portalCredentials = {};
let adminToken = '';
let org = {};
let pmmVersion;
let contactName;

BeforeSuite(async ({ homePage }) => {
  pmmVersion = await homePage.getVersions().versionMinor;
});

Scenario(
  'Prepare credentials for PMM-Portal upgrade @not-ui-pipeline @pre-pmm-portal-upgrade @portal @post-pmm-portal-upgrade',
  async ({
    I, portalAPI, settingsAPI, pmmSettingsPage,
  }) => {
    const userCredentials = await I.readFileSync(fileName, true);

    if (userCredentials !== null && userCredentials.length > 0) {
      portalCredentials = JSON.parse(userCredentials);
    } else {
      await settingsAPI.changeSettings({ publicAddress: pmmSettingsPage.publicAddress });
      portalCredentials = await portalAPI.createServiceNowUsers();
      const newAdminUser = await portalAPI.getUser();

      await portalAPI.oktaCreateUser(portalCredentials.admin1);
      await portalAPI.oktaCreateUser(portalCredentials.admin2);
      await portalAPI.oktaCreateUser(portalCredentials.technical);
      await portalAPI.oktaCreateUser(newAdminUser);
      adminToken = await portalAPI.getUserAccessToken(portalCredentials.admin1.email, portalCredentials.admin1.password);
      org = await portalAPI.apiCreateOrg(adminToken);

      portalCredentials.nonSnAdmin = newAdminUser;
      await portalAPI.apiInviteOrgMember(adminToken, org.id, { username: portalCredentials.admin2.email, role: 'Admin' });
      await portalAPI.apiInviteOrgMember(adminToken, org.id, { username: portalCredentials.technical.email, role: 'Technical' });
      await portalAPI.apiInviteOrgMember(adminToken, org.id, { username: newAdminUser.email, role: 'Admin' });
      await I.writeFileSync(fileName, JSON.stringify(portalCredentials), true);
    }
  },
);

Scenario(
  'PMM-T1112 Verify user can disconnect pmm from portal success flow @portal @not-ui-pipeline @post-pmm-portal-upgrade',
  async ({
    I, homePage, perconaPlatformPage,
  }) => {
    if (pmmVersion >= 27 || pmmVersion === undefined) {
      I.say('Also covers: PMM-T1098 Verify login using Percona Platform account');
      I.amOnPage('');
      await I.loginWithSSO(portalCredentials.admin1.email, portalCredentials.admin1.password);

      I.waitInUrl(homePage.landingUrl);
      I.amOnPage(perconaPlatformPage.url);
      await perconaPlatformPage.disconnectFromPortal(pmmVersion);
      I.unAuthorize();
      I.waitInUrl('graph/login', 10);
      I.dontSeeElement(locate('a').withAttr({ href: 'login/generic_oauth' }));
      I.amOnPage(homePage.genericOauthUrl);
      I.seeElement(locate('div').withText('OAuth not enabled'));
      I.amOnPage('');
      I.seeElement(locate('h1').withText('Percona Monitoring and Management'));
    } else {
      I.say('This testcase is for PMM version 2.27.0 and higher');
    }
  },
);

Scenario(
  'PMM-T1247 Verify user cannot access platform functionality when PMM is not connected to the portal. @not-ui-pipeline @portal @post-pmm-portal-upgrade',
  async ({
    I, environmentOverviewPage, organizationEntitlementsPage, organizationTicketsPage,
  }) => {
    if (pmmVersion >= 27 || pmmVersion === undefined) {
      await I.Authorize();
      I.amOnPage(environmentOverviewPage.url);
      await I.waitForVisible(environmentOverviewPage.elements.notConnectedToPortal);

      assert.equal(
        environmentOverviewPage.messages.notConnectedToPortal,
        await I.grabTextFrom(environmentOverviewPage.elements.notConnectedToPortal),
        'Displayed message is not correct.',
      );
      I.amOnPage(organizationEntitlementsPage.url);
      await I.waitForVisible(environmentOverviewPage.elements.notConnectedToPortal);

      assert.equal(
        environmentOverviewPage.messages.notConnectedToPortal,
        await I.grabTextFrom(environmentOverviewPage.elements.notConnectedToPortal),
        'Displayed message is not correct.',
      );
      I.amOnPage(organizationTicketsPage.url);
      assert.equal(
        environmentOverviewPage.messages.notConnectedToPortal,
        await I.grabTextFrom(environmentOverviewPage.elements.notConnectedToPortal),
        'Displayed message is not correct.',
      );
    }
  },
);

Scenario(
  'Perform cleanup after PMM upgrade @portal @not-ui-pipeline @post-pmm-portal-upgrade',
  async ({ portalAPI }) => {
    const orgResponse = await portalAPI.apiGetOrg(adminToken);

    await portalAPI.apiDeleteOrg(orgResponse[0].id, adminToken);
    await portalAPI.oktaDeleteUserByEmail(portalCredentials.admin1.email);
    await portalAPI.oktaDeleteUserByEmail(portalCredentials.admin2.email);
    await portalAPI.oktaDeleteUserByEmail(portalCredentials.technical.email);
    await portalAPI.oktaDeleteUserByEmail(portalCredentials.nonSnAdmin.email);
  },
);
