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
  if (pmmVersion >= 27 || pmmVersion === undefined) {
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
  }
});

AfterSuite(async ({ portalAPI }) => {
  if (grafana_session_cookie !== undefined) {
    await portalAPI.disconnectPMMFromPortal(grafana_session_cookie);
  }

  await portalAPI.apiDeleteOrg(serviceNowOrg.id, adminToken);
  await portalAPI.oktaDeleteUserByEmail(snCredentials.admin1.email);
  await portalAPI.oktaDeleteUserByEmail(snCredentials.admin2.email);
  await portalAPI.oktaDeleteUserByEmail(snCredentials.technical.email);
});

Scenario(
  'PMM-T1152 Verify user logged in using SSO and is a member of SN account is able to see Entitlemets @portal @post-pmm-portal-upgrade',
  async ({
    I, homePage, organizationEntitlementsPage,
  }) => {
    if (pmmVersion >= 27 || pmmVersion === undefined) {
      I.amOnPage('');
      I.loginWithSSO(snCredentials.admin1.email, snCredentials.admin1.password);
      await I.waitInUrl(homePage.landingUrl);
      grafana_session_cookie = await I.getBrowserGrafanaSessionCookies();
      I.amOnPage(organizationEntitlementsPage.url);
      await I.waitForVisible(organizationEntitlementsPage.elements.entitlementsMenuIcon);
      await I.waitForVisible(organizationEntitlementsPage.elements.header);
      await I.waitForVisible(organizationEntitlementsPage.elements.tableRow);
      await I.dontSeeElement(organizationEntitlementsPage.elements.noDataPage);

      await I.mockServer('**/v1/Platform/SearchOrganizationEntitlements', { entitlements: [] });
      await I.refreshPage();
      await I.waitForVisible(organizationEntitlementsPage.elements.header);
      await I.waitForVisible(organizationEntitlementsPage.elements.noDataPage, 30);
      await I.dontSeeElement(organizationEntitlementsPage.elements.tableRow);
      // Wait needed due to rerender, otherwise test fails.
      I.wait(5);
      const errorMessage = await I.grabTextFrom(organizationEntitlementsPage.elements.noDataPage);

      assert.strictEqual(
        errorMessage,
        organizationEntitlementsPage.messages.noTicketsFound,
        'Text for no Entitlements displayed does not equal expected text',
      );
    } else {
      I.say('This testcase is for PMM version 2.27.0 and higher');
    }
  },
);

Scenario(
  'PMM-T1153 Verify user logged in using SSO and is not a member of SN account is NOT able to see Entitlemets @portal @post-pmm-portal-upgrade',
  async ({
    I, organizationEntitlementsPage, portalAPI, homePage,
  }) => {
    if (pmmVersion >= 27 || pmmVersion === undefined) {
      const newUser = await portalAPI.getUser();

      await portalAPI.oktaCreateUser(newUser);
      await portalAPI.apiInviteOrgMember(adminToken, serviceNowOrg.id, { username: newUser.email, role: 'Admin' });

      await I.amOnPage('');
      await I.loginWithSSO(newUser.email, newUser.password);
      await I.waitInUrl(homePage.landingUrl);
      await I.waitForVisible(organizationEntitlementsPage.elements.entitlementsMenuIcon);
      I.amOnPage(organizationEntitlementsPage.url);
      await I.waitForVisible(organizationEntitlementsPage.elements.header);
      await I.waitForVisible(organizationEntitlementsPage.elements.noDataPage, 30);
      // Wait needed due to rerender, otherwise test fails.
      I.wait(5);
      const errorMessage = await I.grabTextFrom(organizationEntitlementsPage.elements.noDataPage);

      assert.strictEqual(
        errorMessage,
        organizationEntitlementsPage.messages.noTicketsFound,
        'Text for no Entitlements displayed does not equal expected text',
      );
    } else {
      I.say('This testcase is for PMM version 2.27.0 and higher');
    }
  },
);

Scenario(
  'PMM-T1154 Verify PMM user that is not logged in with SSO can NOT see Entitlements for organization @portal @post-pmm-portal-upgrade',
  async ({ I, organizationEntitlementsPage, portalAPI }) => {
    if (pmmVersion >= 27 || pmmVersion === undefined) {
      const newUser = await portalAPI.getUser();
      const newUserId = await I.createUser(newUser.email, newUser.password);

      await I.setRole(newUserId, 'Admin');
      await I.Authorize(newUser.email, newUser.password);
      await I.amOnPage('');
      I.amOnPage(organizationEntitlementsPage.url);
      await I.waitForVisible(organizationEntitlementsPage.elements.header);
      if (pmmVersion >= 28 || pmmVersion === undefined) {
        await I.waitForVisible(organizationEntitlementsPage.elements.notPlatformUser, 30);
        assert.strictEqual(
          organizationEntitlementsPage.messages.loginWithPercona,
          await I.grabTextFrom(organizationEntitlementsPage.elements.notPlatformUser),
          'Text for no Entitlements displayed does not equal expected text',
        );
      } else {
        await I.waitForVisible(organizationEntitlementsPage.elements.emptyBlock, 30);
        const errorMessage = await I.grabTextFrom(organizationEntitlementsPage.elements.emptyBlock);

        assert.ok(
          errorMessage.includes(organizationEntitlementsPage.messages.notConnectedToThePortal),
          'Text for no Entitlements displayed does not equal expected text',
        );
      }
    } else {
      I.say('This testcase is for PMM version 2.27.0 and higher');
    }
  },
);
