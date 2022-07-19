const assert = require('assert');

const { homePage } = inject();

Feature('Portal integration for Entitlements and Tickets with PMM');

const fileName = 'portalCredentials';
let portalCredentials = {};
let adminToken = '';
const pmmVersion = homePage.getVersions().versionMinor;
let serviceNowOrg;
let grafana_session_cookie;

BeforeSuite(async ({
  I, portalAPI, settingsAPI, codeceptjsConfig,
}) => {
  const userCredentials = await I.readFileSync(fileName, true);

  if (userCredentials !== null && userCredentials.length > 0) {
    portalCredentials = JSON.parse(userCredentials);
    adminToken = await portalAPI.getUserAccessToken(portalCredentials.admin1.email, portalCredentials.admin1.password);
    serviceNowOrg = await portalAPI.apiGetOrg(adminToken);
    I.say(JSON.stringify(serviceNowOrg));
  } else {
    portalCredentials = await portalAPI.createServiceNowUsers();
    await portalAPI.oktaCreateUser(portalCredentials.admin1);
    await portalAPI.oktaCreateUser(portalCredentials.admin2);
    await portalAPI.oktaCreateUser(portalCredentials.technical);
    adminToken = await portalAPI.getUserAccessToken(portalCredentials.admin1.email, portalCredentials.admin1.password);
    serviceNowOrg = await portalAPI.apiCreateOrg(adminToken);

    const url = new URL(codeceptjsConfig.config.helpers.Playwright.url);

    await settingsAPI.changeSettings({ publicAddress: url.host });
    await portalAPI.connectPMMToPortal(adminToken);
    await portalAPI.apiInviteOrgMember(adminToken, serviceNowOrg.id, { username: portalCredentials.admin2.email, role: 'Admin' });
    await portalAPI.apiInviteOrgMember(adminToken, serviceNowOrg.id, {
      username: portalCredentials.technical.email,
      role: 'Technical',
    });
  }
});

AfterSuite(async ({ portalAPI }) => {
  if (grafana_session_cookie !== undefined) {
    await portalAPI.disconnectPMMFromPortal(grafana_session_cookie);
  }

  await portalAPI.apiDeleteOrg(serviceNowOrg.id, adminToken);
  await portalAPI.oktaDeleteUserByEmail(portalCredentials.admin1.email);
  await portalAPI.oktaDeleteUserByEmail(portalCredentials.admin2.email);
  await portalAPI.oktaDeleteUserByEmail(portalCredentials.technical.email);
});

Scenario(
  'PMM-T1132 Verify PMM user logged in using SSO and member of SN account is able to see tickets @portal2 @post-pmm-portal-upgrade',
  async ({ I, homePage, organizationTicketsPage }) => {
    I.amOnPage('');
    await I.loginWithSSO(portalCredentials.admin1.email, portalCredentials.admin1.password);
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
  },
);

Scenario(
  'PMM-T1147 Verify PMM user that is not logged in with SSO can NOT see Tickets for organization @portal @post-pmm-portal-upgrade',
  async ({ I, organizationTicketsPage, portalAPI }) => {
    const newUser = await portalAPI.getUser();
    const newUserId = await I.createUser(newUser.email, newUser.password);

    await I.setRole(newUserId, 'Admin');
    await I.Authorize(newUser.email, newUser.password);
    await I.amOnPage('');
    I.dontSeeElement(organizationTicketsPage.elements.ticketsMenuIcon);
    I.amOnPage(organizationTicketsPage.url);
    await I.waitForVisible(organizationTicketsPage.elements.header);
    if (pmmVersion >= 28) {
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
  },
);

Scenario(
  'PMM-T1148 Verify PMM user logged in using SSO and member of organization in Portal BUT not a SN account is NOT able to see Tickets @portal @post-pmm-portal-upgrade',
  async ({
    I, organizationTicketsPage, portalAPI, homePage,
  }) => {
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
  },
);

Scenario(
  'PMM-T1149 Verify PMM user logged in using SSO and is a member of SN account is able to see empty list of tickets @portal @post-pmm-portal-upgrade',
  async ({
    I, organizationTicketsPage, homePage,
  }) => {
    I.amOnPage('');
    await I.loginWithSSO(portalCredentials.admin1.email, portalCredentials.admin1.password);
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
  },
);

/*
    Entitlements tests
  */

Scenario(
  'PMM-T1152 Verify user logged in using SSO and is a member of SN account is able to see Entitlements @portal @post-pmm-portal-upgrade',
  async ({
    I, homePage, organizationEntitlementsPage,
  }) => {
    I.amOnPage('');
    await I.loginWithSSO(portalCredentials.admin1.email, portalCredentials.admin1.password);
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
  },
);

Scenario(
  'PMM-T1153 Verify user logged in using SSO and is not a member of SN account is NOT able to see Entitlements @portal @post-pmm-portal-upgrade',
  async ({
    I, organizationEntitlementsPage, portalAPI, homePage,
  }) => {
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
  },
);

Scenario(
  'PMM-T1154 Verify PMM user that is not logged in with SSO can NOT see Entitlements for organization @portal @post-pmm-portal-upgrade',
  async ({ I, organizationEntitlementsPage, portalAPI }) => {
    const newUser = await portalAPI.getUser();
    const newUserId = await I.createUser(newUser.email, newUser.password);

    await I.setRole(newUserId, 'Admin');
    await I.Authorize(newUser.email, newUser.password);
    await I.amOnPage('');
    I.amOnPage(organizationEntitlementsPage.url);
    await I.waitForVisible(organizationEntitlementsPage.elements.header);
    if (pmmVersion >= 28) {
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
  },
);
