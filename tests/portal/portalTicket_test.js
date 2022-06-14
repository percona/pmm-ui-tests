const assert = require('assert');

Feature('Portal Tickets integration with PMM');

let snCredentials = {};
let adminToken = '';
let pmmVersion;
let serviceNowOrg;
let grafana_session_cookie;

BeforeSuite(async ({
  I, homePage, portalAPI, settingsAPI, pmmSettingsPage,
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
  } else {
    I.say('This test suite is for PMM version 2.27.0 and higher');
  }
});

AfterSuite(async ({ portalAPI }) => {
  if (pmmVersion >= 27 || pmmVersion === undefined) {
    if (grafana_session_cookie !== undefined) {
      await portalAPI.disconnectPMMFromPortal(grafana_session_cookie);
    }

    await portalAPI.apiDeleteOrg(serviceNowOrg.id, adminToken);
    await portalAPI.oktaDeleteUserByEmail(snCredentials.admin1.email);
    await portalAPI.oktaDeleteUserByEmail(snCredentials.admin2.email);
    await portalAPI.oktaDeleteUserByEmail(snCredentials.technical.email);
  }
});

Scenario(
  'PMM-T1132 Verify PMM user logged in using SSO and member of SN account is able to see tickets @portal @post-pmm-portal-upgrade',
  async ({ I, homePage, organizationTicketsPage }) => {
    if (pmmVersion >= 27 || pmmVersion === undefined) {
      I.amOnPage('');
      I.loginWithSSO(snCredentials.admin1.email, snCredentials.admin1.password);
      await I.waitInUrl(homePage.landingUrl);
      grafana_session_cookie = await I.getBrowserGrafanaSessionCookies();
      I.amOnPage(organizationTicketsPage.url);
      await I.waitForVisible(organizationTicketsPage.elements.header);
      await I.waitForVisible(organizationTicketsPage.elements.ticketTableRows);
      await I.waitForVisible(organizationTicketsPage.elements.ticketTableHead);
      I.click(`${organizationTicketsPage.elements.ticketTableRows}[1]`);
      // Wait needed otherwise, browser does not know that there is another tab being opened
      I.wait(5);
      I.switchToNextTab();
      await I.waitInUrl(organizationTicketsPage.serviceNowUrl);
    } else {
      I.say('This testcase is for PMM version 2.27.0 and higher');
    }
  },
);

Scenario(
  'PMM-T1147 Verify PMM user that is not logged in with SSO can NOT see Tickets for organization @portal @post-pmm-portal-upgrade',
  async ({ I, organizationTicketsPage, portalAPI }) => {
    if (pmmVersion >= 27 || pmmVersion === undefined) {
      const newUser = await portalAPI.getUser();
      const newUserId = await I.createUser(newUser.email, newUser.password);

      await I.setRole(newUserId, 'Admin');
      await I.Authorize(newUser.email, newUser.password);
      await I.amOnPage('');
      I.dontSeeElement(organizationTicketsPage.elements.ticketsMenuIcon);
      I.amOnPage(organizationTicketsPage.url);
      await I.waitForVisible(organizationTicketsPage.elements.header);
      if (pmmVersion >= 28 || pmmVersion === undefined) {
        await I.waitForVisible(organizationTicketsPage.elements.notPlatformUser, 30);
        assert.equal(
          await I.grabTextFrom(organizationTicketsPage.elements.notPlatformUser),
          organizationTicketsPage.messages.loginWithPercona,
          'Text for no tickets displayed does not equal expected text',
        );
      } else {
        await I.waitForVisible(organizationTicketsPage.elements.emptyBlock, 30);
        const errorMessage = await I.grabTextFrom(organizationTicketsPage.elements.emptyBlock);

        assert.ok(
          errorMessage.includes(organizationTicketsPage.messages.notConnectedToThePortal),
          'Text for no Entitlements displayed does not equal expected text',
        );
      }
    } else {
      I.say('This testcase is for PMM version 2.27.0 and higher');
    }
  },
);

Scenario(
  'PMM-T1148 Verify PMM user logged in using SSO and member of organization in Portal BUT not a SN account is NOT able to see Tickets @portal @post-pmm-portal-upgrade',
  async ({
    I, organizationTicketsPage, portalAPI, homePage,
  }) => {
    if (pmmVersion >= 27 || pmmVersion === undefined) {
      const newUser = await portalAPI.getUser();

      await portalAPI.oktaCreateUser(newUser);
      await portalAPI.apiInviteOrgMember(adminToken, serviceNowOrg.id, { username: newUser.email, role: 'Admin' });
      await I.amOnPage('');
      await I.loginWithSSO(newUser.email, newUser.password);
      await I.waitInUrl(homePage.landingUrl);
      I.waitForVisible(organizationTicketsPage.elements.ticketsMenuIcon);
      I.amOnPage(organizationTicketsPage.url);
      await I.waitForVisible(organizationTicketsPage.elements.header);
      await I.waitForVisible(organizationTicketsPage.elements.noDataTable, 30);
      // Wait needed due to rerender, otherwise test crashes.
      I.wait(5);
      const errorMessage = await I.grabTextFrom(organizationTicketsPage.elements.noDataTable);

      assert.equal(
        errorMessage,
        organizationTicketsPage.messages.noTicketsFound,
        'Text for no tickets displayed does not equal expected text',
      );
    } else {
      I.say('This testcase is for PMM version 2.27.0 and higher');
    }
  },
);

Scenario(
  'PMM-T1149 Verify PMM user logged in using SSO and is a member of SN account is able to see empty list of tickets @portal @post-pmm-portal-upgrade',
  async ({
    I, organizationTicketsPage, homePage,
  }) => {
    if (pmmVersion >= 27 || pmmVersion === undefined) {
      I.amOnPage('');
      I.loginWithSSO(snCredentials.admin1.email, snCredentials.admin1.password);
      await I.waitInUrl(homePage.landingUrl);
      I.waitForVisible(organizationTicketsPage.elements.ticketsMenuIcon);
      await I.mockServer('**/v1/Platform/SearchOrganizationTickets', { tickets: [] });
      I.amOnPage(organizationTicketsPage.url);
      await I.waitForVisible(organizationTicketsPage.elements.header);
      await I.waitForVisible(organizationTicketsPage.elements.noDataTable, 30);
      const errorMessage = await I.grabTextFrom(organizationTicketsPage.elements.noDataTable);

      assert.equal(
        errorMessage,
        organizationTicketsPage.messages.noTicketsFound,
        'Text for no tickets displayed does not equal expected text',
      );
    } else {
      I.say('This testcase is for PMM version 2.27.0 and higher');
    }
  },
);
