const assert = require('assert');
const portalAPI = require('../pages/api/portalAPI');

Feature('Portal Integration with PMM');

const fileName = 'portalCredentials';
let portalCredentials = {};
let adminToken = '';
let pmmVersion;

BeforeSuite(async ({ homePage }) => {
  pmmVersion = await homePage.getVersions().versionMinor;
});

Scenario(
  'Prepare credentials for PMM-Portal upgrade @not-ui-pipeline @pre-pmm-portal-upgrade @portal @post-pmm-portal-upgrade',
  async ({
    I, portalAPI,
  }) => {
    const userCredentials = await I.readFileSync(fileName, true);

    if (userCredentials !== null && userCredentials.length > 0) {
      portalCredentials = JSON.parse(userCredentials);
    } else {
      portalCredentials = await portalAPI.createServiceNowUsers();
      await portalAPI.oktaCreateUser(portalCredentials.admin1);
      await portalAPI.oktaCreateUser(portalCredentials.admin2);
      await portalAPI.oktaCreateUser(portalCredentials.technical);
      adminToken = await portalAPI.getUserAccessToken(portalCredentials.admin1.email, portalCredentials.admin1.password);
      const orgResp = await portalAPI.apiCreateOrg(adminToken);

      await portalAPI.apiInviteOrgMember(adminToken, orgResp.id, { username: portalCredentials.admin2.email, role: 'Admin' });
      await portalAPI.apiInviteOrgMember(adminToken, orgResp.id, { username: portalCredentials.technical.email, role: 'Technical' });
      await I.writeFileSync(fileName, JSON.stringify(portalCredentials), true);
    }
  },
);

Scenario(
  'PMM-T398 PMM-T809 Verify Connect to Percona Portal elements @portal @pre-pmm-portal-upgrade',
  async ({ I, links, perconaPlatformPage }) => {
    const {
      buttons, elements, fields, url, messages,
    } = perconaPlatformPage;

    await I.Authorize();
    I.amOnPage(url);
    I.waitForVisible(elements.connectForm, 30);

    // Verify elements in connect form
    I.seeTextEquals('Connect PMM to Percona Platform', 'legend');
    I.seeTextEquals('PMM Server Name *', elements.pmmServerNameFieldLabel);
    I.seeTextEquals('Percona Platform Access Token *', elements.accessTokenLabel);
    I.seeInField(fields.accessToken, '');
    I.seeAttributesOnElements(elements.getAccessTokenLink, { href: links.portalProfile });
    I.seeAttributesOnElements(buttons.connect, { disabled: true });

    // Focus on PMM Server Name and Access token fields to verify that fields are required
    I.usePlaywrightTo('focus on PMM Server Name and Access token fields', async ({ page }) => {
      page.focus(I.useDataQA('accessToken-text-input'));
      page.focus(I.useDataQA('pmmServerName-text-input'));
      page.focus(I.useDataQA('accessToken-text-input'));
    });

    I.seeTextEquals(messages.requiredField, elements.accessTokenValidation);
    I.seeTextEquals(messages.requiredField, elements.pmmServerNameValidation);

    I.appendField(fields.pmmServerNameField, 'serverName');
    I.seeTextEquals('', elements.pmmServerNameValidation);

    I.appendField(fields.accessToken, 'someToken');
    I.seeTextEquals('', elements.accessTokenValidation);

    I.seeAttributesOnElements(buttons.connect, { disabled: null });
  },
);

Scenario(
  'PMM-T1097 Verify PMM server is connected to Portal @not-ui-pipeline @portal @pre-pmm-portal-upgrade',
  async ({
    I, pmmSettingsPage, portalAPI, perconaPlatformPage,
  }) => {
    await I.Authorize();
    pmmSettingsPage.openAdvancedSettings();
    const publicAddress = await I.grabValueFrom(pmmSettingsPage.fields.publicAddressInput);

    if (publicAddress.length !== 0) pmmSettingsPage.clearPublicAddress();

    pmmSettingsPage.addPublicAddress();
    perconaPlatformPage.openPerconaPlatform();
    const userToken = await portalAPI.getUserAccessToken(portalCredentials.admin1.email, portalCredentials.admin1.password);

    await perconaPlatformPage.openPerconaPlatform();
    await perconaPlatformPage.connectToPortal(userToken, `Test Server ${Date.now()}`);
  },
);

Scenario(
  'Verify All org users can login in connected PMM server @not-ui-pipeline @pre-pmm-portal-upgrade @post-pmm-portal-upgrade',
  async ({
    I, homePage,
  }) => {
    I.say('Also covers: PMM-T1098 Verify login using Percona Platform account');
    I.amOnPage('');
    await I.loginWithSSO(portalCredentials.admin1.email, portalCredentials.admin1.password);
    await I.waitInUrl(homePage.landingUrl);
    I.unAuthorize();
    await I.loginWithSSO(portalCredentials.admin2.email, portalCredentials.admin2.password);
    await I.waitInUrl(homePage.landingUrl);
    I.unAuthorize();
    await I.loginWithSSO(portalCredentials.technical.email, portalCredentials.technical.password);
    await I.waitInUrl(homePage.landingUrl);
  },
);

Scenario(
  'Verify user is able to Upgrade PMM version @not-ui-pipeline @pmm-portal-upgrade',
  async ({ I, homePage }) => {
    const { versionMinor } = homePage.getVersions();

    await I.Authorize();
    I.amOnPage(homePage.url);
    await homePage.upgradePMM(versionMinor);
  },
).retry(0);

Scenario(
  'Verify user roles are untouched after PMM server upgrade @not-ui-pipeline @post-pmm-portal-upgrade',
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
  'Verify PMM is connected and user can disconnect an reconnect PMM server to the Portal @not-ui-pipeline @post-pmm-portal-upgrade',
  async ({
    I, perconaPlatformPage, homePage,
  }) => {
    I.amOnPage('');
    I.loginWithSSO(portalCredentials.admin1.email, portalCredentials.admin1.password);
    await I.waitInUrl(homePage.landingUrl);

    await perconaPlatformPage.openPerconaPlatform();
    await perconaPlatformPage.isPMMConnected();
    await perconaPlatformPage.disconnectFromPortal(pmmVersion);
    if (pmmVersion > 27 || pmmVersion === undefined) {
      await I.waitInUrl(homePage.landingPage);
      I.Authorize();
      await perconaPlatformPage.openPerconaPlatform();
      await perconaPlatformPage.waitForPerconaPlatformPageLoaded();
    }

    await I.waitForVisible(perconaPlatformPage.elements.connectForm);
    adminToken = await portalAPI.getUserAccessToken(portalCredentials.admin1.email, portalCredentials.admin1.password);
    perconaPlatformPage.connectToPortal(adminToken, `Test Server ${Date.now()}`);
  },
);

Scenario(
  'PMM-T1112 Verify user can disconnect pmm from portal success flow @portal @not-ui-pipeline @post-pmm-portal-upgrade',
  async ({
    I, homePage, perconaPlatformPage,
  }) => {
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
  },
);
