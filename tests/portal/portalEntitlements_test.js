const assert = require('assert');

Feature('Portal Entitlements integration with PMM');

let snCredentials = {};
let adminToken = '';
let pmmVersion;
let serviceNowOrg;
let grafana_session_cookie;

BeforeSuite(async ({
  homePage, portalAPI, settingsAPI, pmmSettingsPage,
}) => {
  pmmVersion = await homePage.getVersions().versionMinor;
  snCredentials = await portalAPI.createServiceNowUsers();
  await portalAPI.oktaCreateUser(snCredentials.admin1);
  await portalAPI.oktaCreateUser(snCredentials.admin2);
  await portalAPI.oktaCreateUser(snCredentials.technical);
  adminToken = await portalAPI.getUserAccessToken(snCredentials.admin1.email, snCredentials.admin1.password);
  serviceNowOrg = await portalAPI.apiCreateOrg(adminToken);

  await settingsAPI.changeSettings({ publicAddress: pmmSettingsPage.publicAddress });
  await portalAPI.connectPMMToPortal(adminToken);
  await portalAPI.apiInviteOrgMember(adminToken, serviceNowOrg.id, { username: snCredentials.admin2.email, role: 'Admin' });
  await portalAPI.apiInviteOrgMember(adminToken, serviceNowOrg.id, {
    username: snCredentials.technical.email,
    role: 'Technical',
  });
});

AfterSuite(async ({ portalAPI }) => {
  await portalAPI.disconnectPMMFromPortal(grafana_session_cookie);
});

Scenario(
  'PMM-T1152 Verify PMM user logged in using SSO and member of SN account is able to see tickets @portal @post-pmm-portal-upgrade',
  async ({ I, homePage, organizationEntitlementsPage }) => {
    if (pmmVersion >= 27) {
      I.amOnPage('');
      I.loginWithSSO(snCredentials.admin1.email, snCredentials.admin1.password);
      await I.waitInUrl(homePage.landingUrl);
      const cookies = await I.getBrowserCookies();

      grafana_session_cookie = await cookies.find((cookie) => cookie.name === 'grafana_session');
      I.amOnPage(organizationEntitlementsPage.url);
      await I.waitForVisible(organizationEntitlementsPage.elements.entitlementsMenuIcon);
      await I.waitForVisible(organizationEntitlementsPage.elements.header);
      await I.waitForVisible(organizationEntitlementsPage.elements.tableRow);
      await I.mockServer('**/v1/Platform/SearchOrganizationEntitlements', { entitlements: [] });
      await I.refreshPage();
      await I.waitForVisible(organizationEntitlementsPage.elements.header);
      await I.waitForVisible(organizationEntitlementsPage.elements.noDataPage, 30);
      // Wait needed due to rerender, otherwise test crashes.
      I.wait(5);
      pause();
      const errorMessage = await I.grabTextFrom(organizationEntitlementsPage.elements.noDataPage);
    } else {
      I.say('This testcase is for PMM version 2.27.0 and higher');
    }
  },
);
/*
Scenario(
  'PMM-T1153 Verify user logged in using SSO and is not a member of SN account is NOT able to see Entitlemets @portal @post-pmm-portal-upgrade',
  async ({ I, organizationEntitlementsPage, portalAPI }) => {
    if (pmmVersion >= 27) {
      const newUser = await portalAPI.getUser();
      const newUserId = await I.createUser(newUser.email, newUser.password);

      await I.setRole(newUserId, 'Admin');
      await I.Authorize(newUser.email, newUser.password);
      await I.amOnPage('');
      I.dontSeeElement(organizationEntitlementsPage.elements.entitlementsMenuIcon);
      I.amOnPage(organizationEntitlementsPage.url);
      await I.waitForVisible(organizationEntitlementsPage.elements.header);
      await I.waitForVisible(organizationEntitlementsPage.elements.notPlatformUser, 30);
      const errorMessage = await I.grabTextFrom(organizationEntitlementsPage.elements.notPlatformUser);

      assert.equal(
        errorMessage,
        organizationEntitlementsPage.messages.loginWithPercona,
        'Text for no tickets displayed does not equal expected text',
      );
    } else {
      I.say('This testcase is for PMM version 2.27.0 and higher');
    }
  },
);

Scenario(
  'PMM-T1154 Verify PMM user that is not logged in with SSO can NOT see Entitlements for organization @portal @post-pmm-portal-upgrade',
  async ({
    I, organizationEntitlementsPage, portalAPI, homePage,
  }) => {
    if (pmmVersion >= 27) {
      const newUser = await portalAPI.getUser();

      await portalAPI.oktaCreateUser(newUser);
      await portalAPI.apiInviteOrgMember(adminToken, serviceNowOrg.id, { username: newUser.email, role: 'Admin' });
      await I.amOnPage('');
      await I.loginWithSSO(newUser.email, newUser.password);
      await I.waitInUrl(homePage.landingUrl);
      I.waitForVisible(organizationEntitlementsPage.elements.entitlementsMenuIcon);
      I.amOnPage(organizationEntitlementsPage.url);
      await I.waitForVisible(organizationEntitlementsPage.elements.header);
      await I.waitForVisible(organizationEntitlementsPage.elements.noDataPage, 30);
      // Wait needed due to rerender, otherwise test crashes.
      I.wait(5);
      const errorMessage = await I.grabTextFrom(organizationEntitlementsPage.elements.noDataPage);

      assert.equal(
        errorMessage,
        organizationEntitlementsPage.messages.noTicketsFound,
        'Text for no tickets displayed does not equal expected text',
      );
    } else {
      I.say('This testcase is for PMM version 2.27.0 and higher');
    }
  },
);
*/
