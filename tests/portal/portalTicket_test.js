Feature('Portal Tickets integration with PMM');

let snCredentials = {};
let adminToken = '';
let pmmVersion;

BeforeSuite(async ({
  homePage, portalAPI, settingsAPI, pmmSettingsPage,
}) => {
  pmmVersion = await homePage.getVersions().versionMinor;
  snCredentials = await portalAPI.createServiceNowUsers();
  await portalAPI.oktaCreateUser(snCredentials.admin1);
  await portalAPI.oktaCreateUser(snCredentials.admin2);
  await portalAPI.oktaCreateUser(snCredentials.technical);
  adminToken = await portalAPI.getUserAccessToken(snCredentials.admin1.email, snCredentials.admin1.password);
  const orgResp = await portalAPI.apiCreateOrg(adminToken);

  await settingsAPI.changeSettings({ publicAddress: pmmSettingsPage.publicAddress });
  await portalAPI.connectPMMToPortal(adminToken);
  await portalAPI.apiInviteOrgMember(adminToken, orgResp.id, { username: snCredentials.admin2.email, role: 'Admin' });
  await portalAPI.apiInviteOrgMember(adminToken, orgResp.id, { username: snCredentials.technical.email, role: 'Technical' });
});

Scenario(
  'PMM-T1132 Verify PMM user logged in using SSO and member of SN account is able to see tickets @not-ui-pipeline @portalTickets @post-pmm-portal-upgrade',
  async ({
    I, homePage, organizationTicketsPage,
  }) => {
    if (pmmVersion >= 27) {
      I.amOnPage('');
      I.loginWithSSO(snCredentials.admin1.email, snCredentials.admin1.password);
      await I.waitInUrl(homePage.landingUrl);
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
  'PMM-T1147 Verify PMM user that is not logged in with SSO can NOT see Tickets for organization @not-ui-pipeline @portalTickets @post-pmm-portal-upgrade',
  async ({
    I,
  }) => {
    if (pmmVersion >= 27) {
      I.say('This testcase is for PMM version 2.27.0 and higher');
    } else {
      I.say('This testcase is for PMM version 2.27.0 and higher');
    }
  },
);
