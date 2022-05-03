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

if (pmmVersion >= 27) {
  Scenario(
    'PMM-T1132 Verify PMM user logged in using SSO and member of SN account is able to see tickets @not-ui-pipeline @portalTickets @post-pmm-portal-upgrade',
    async ({
      I, homePage,
    }) => {
      I.say('Testcase running');
      I.say(`PMM Version Is: ${pmmVersion}`);
      I.amOnPage('');
      I.loginWithSSO(snCredentials.admin1.email, snCredentials.admin1.password);
      I.waitInUrl(homePage.landingUrl);
    },
  );
}

Scenario(
  'PMM-T1132_2 Verify PMM user logged in using SSO and member of SN account is able to see tickets @not-ui-pipeline @portalTickets @post-pmm-portal-upgrade',
  async ({
    I, homePage,
  }) => {
    I.say('Testcase running');
    I.say(`PMM Version Is: ${pmmVersion}`);
    I.amOnPage('');
    I.loginWithSSO(snCredentials.admin1.email, snCredentials.admin1.password);
    I.waitInUrl(homePage.landingUrl);
  },
);
