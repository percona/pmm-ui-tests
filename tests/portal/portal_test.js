const assert = require('assert');

Feature('Portal Integration with PMM');

const fileName = 'portalCredentials';
let portalCredentials = {};
let adminToken = '';
let org = {};
let pmmVersion;
let newAdminUser;

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
      await portalAPI.oktaCreateUser(portalCredentials.admin1);
      await portalAPI.oktaCreateUser(portalCredentials.admin2);
      await portalAPI.oktaCreateUser(portalCredentials.technical);
      adminToken = await portalAPI.getUserAccessToken(portalCredentials.admin1.email, portalCredentials.admin1.password);
      org = await portalAPI.apiCreateOrg(adminToken);

      await portalAPI.apiInviteOrgMember(adminToken, org.id, { username: portalCredentials.admin2.email, role: 'Admin' });
      await portalAPI.apiInviteOrgMember(adminToken, org.id, { username: portalCredentials.technical.email, role: 'Technical' });
      await I.writeFileSync(fileName, JSON.stringify(portalCredentials), true);
    }
  },
);

Scenario(
  'PMM-T398 PMM-T809 Verify Connect to Percona Portal elements @portal @pre-pmm-portal-upgrade',
  async ({ I, links, perconaPlatformPage }) => {
    if (pmmVersion >= 27 || pmmVersion === undefined) {
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
    } else {
      I.say('This testcase is for PMM version 2.27.0 and higher');
    }
  },
);

Scenario(
  'PMM-T1224 Verify user is notified about using old PMM version while trying to connect to Portal @portal @pre-pmm-portal-upgrade @post-pmm-portal-upgrade',
  async ({
    I, perconaPlatformPage,
  }) => {
    if (pmmVersion < 27) {
      await I.Authorize();
      perconaPlatformPage.openPerconaPlatform();
      I.say(JSON.stringify(perconaPlatformPage.perconaPlatformPage_2_26));
      I.appendField(perconaPlatformPage.perconaPlatformPage_2_26.fields.pmmServerName, 'Test Server');
      I.appendField(perconaPlatformPage.perconaPlatformPage_2_26.fields.emailInput, portalCredentials.admin1.email);
      I.appendField(perconaPlatformPage.perconaPlatformPage_2_26.fields.passwordInput, portalCredentials.admin1.password);
      I.click(perconaPlatformPage.perconaPlatformPage_2_26.buttons.connectButton);
      perconaPlatformPage.perconaPlatformPage_2_26
        .verifyPopUpMessage(perconaPlatformPage.perconaPlatformPage_2_26.messages.oldPmmVersionError);
      I.refreshPage();
      I.waitForVisible(perconaPlatformPage.perconaPlatformPage_2_26.elements.connectForm, 30);
    } else {
      I.say('This testcase is for PMM version 2.26.0 and lower');
    }
  },
);

Scenario(
  'PMM-T1097 Verify PMM server is connected to Portal @not-ui-pipeline @portal @pre-pmm-portal-upgrade',
  async ({
    I, portalAPI, perconaPlatformPage,
  }) => {
    if (pmmVersion >= 27 || pmmVersion === undefined) {
      await I.Authorize();
      perconaPlatformPage.openPerconaPlatform();
      const userToken = await portalAPI.getUserAccessToken(portalCredentials.admin1.email, portalCredentials.admin1.password);

      await perconaPlatformPage.openPerconaPlatform();
      await perconaPlatformPage.connectToPortal(userToken, `Test Server ${Date.now()}`);
    } else {
      I.say('This testcase is for PMM version 2.27.0 and higher');
    }
  },
);

Scenario(
  'PMM-T1222 Verify user can see the contacts from Percona @not-ui-pipeline @portal @post-pmm-portal-upgrade',
  async ({
    I, portalAPI, homePage, environmentOverviewPage,
  }) => {
    if (pmmVersion >= 29 || pmmVersion === undefined) {
      adminToken = await portalAPI.getUserAccessToken(portalCredentials.admin1.email, portalCredentials.admin1.password);
      const orgResponse = await portalAPI.apiGetOrg(adminToken);
      const orgDetails = await portalAPI.apiGetOrgDetails(orgResponse[0].id, adminToken);

      I.amOnPage('');
      await I.loginWithSSO(portalCredentials.admin1.email, portalCredentials.admin1.password);
      await I.waitInUrl(homePage.landingUrl);
      await I.waitForVisible(environmentOverviewPage.elements.environmentOverviewIcon);
      I.amOnPage(environmentOverviewPage.url);
      await I.waitForVisible(environmentOverviewPage.elements.contactName);
      await I.waitForVisible(locate('strong').withText(environmentOverviewPage.messages.contactsHeader));
      await I.waitForVisible(locate('span').withText(environmentOverviewPage.messages.customerManager));
      const contactName = await I.grabTextFrom(environmentOverviewPage.elements.contactName);

      assert.equal(orgDetails.contacts.customer_success.name, contactName, 'Portal and PMM contacts names are not the same');
    } else {
      I.say('This testcase is for PMM version 2.29.0 and higher');
    }
  },
);

Scenario(
  'PMM-T1249 Verify user logged in using SSO and is not a member of SN account is NOT able to see contacts @not-ui-pipeline @portal @post-pmm-portal-upgrade',
  async ({
    I, portalAPI, homePage, environmentOverviewPage,
  }) => {
    if (pmmVersion >= 27 || pmmVersion === undefined) {
      newAdminUser = await portalAPI.getUser();

      await portalAPI.oktaCreateUser(newAdminUser);
      const orgResponse = await portalAPI.apiGetOrg(adminToken);

      await portalAPI.apiInviteOrgMember(adminToken, orgResponse[0].id, { username: newAdminUser.email, role: 'Admin' });
      I.amOnPage('');
      await I.loginWithSSO(newAdminUser.email, newAdminUser.password);
      await I.waitInUrl(homePage.landingUrl);
      await I.waitForVisible(environmentOverviewPage.elements.environmentOverviewIcon);
      I.amOnPage(environmentOverviewPage.url);
      await I.waitForVisible(locate('strong').withText(environmentOverviewPage.messages.contactsHeader));
      await I.waitForVisible(locate('span').withText(environmentOverviewPage.messages.customerManager));
      await I.dontSeeElement(environmentOverviewPage.elements.contactName);
      I.verifyPopUpMessage(environmentOverviewPage.messages.notPerconaCustomer);
    }
  },
);

Scenario(
  'PMM-T1248 Verify local admin user can not see the contacts from Percona @not-ui-pipeline @portal @post-pmm-portal-upgrade',
  async ({
    I, environmentOverviewPage,
  }) => {
    if (pmmVersion >= 27 || pmmVersion === undefined) {
      await I.Authorize();
      I.amOnPage(environmentOverviewPage.url);
      await I.waitForVisible(environmentOverviewPage.elements.notPlaformUser);
      const warningMessage = await I.grabTextFrom(environmentOverviewPage.elements.notPlaformUser);

      assert.equal(environmentOverviewPage.messages.loginWithPerconaAccount, warningMessage, 'Displayed message is not correct.');
    }
  },
);

Scenario(
  'Verify All org users can login in connected PMM server @not-ui-pipeline @pre-pmm-portal-upgrade @post-pmm-portal-upgrade',
  async ({
    I, homePage,
  }) => {
    if (pmmVersion >= 27 || pmmVersion === undefined) {
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
    } else {
      I.say('This testcase is for PMM version 2.27.0 and higher');
    }
  },
);

Scenario(
  'Verify user is able to Upgrade PMM version @not-ui-pipeline @pmm-portal-upgrade',
  async ({ I, homePage }) => {
    if (pmmVersion >= 27 || pmmVersion === undefined) {
      const { versionMinor } = homePage.getVersions();

      await I.Authorize();
      I.amOnPage(homePage.url);
      await homePage.upgradePMM(versionMinor);
    } else {
      I.say('This testcase is for PMM version 2.27.0 and higher');
    }
  },

).retry(0);

Scenario(
  'Verify user roles are untouched after PMM server upgrade @not-ui-pipeline @post-pmm-portal-upgrade',
  async ({
    I,
  }) => {
    if (pmmVersion >= 27 || pmmVersion === undefined) {
      const users = await I.listOrgUsers();
      const foundAdmin1User = users.find((user) => user.email === portalCredentials.admin1.email);
      const foundAdmin2User = users.find((user) => user.email === portalCredentials.admin2.email);
      const foundTechnicalUser = users.find((user) => user.email === portalCredentials.technical.email);

      assert.ok(foundAdmin1User.role === 'Admin', `User role for the user ${foundAdmin1User.login} was changed.`);
      assert.ok(foundAdmin2User.role === 'Admin', `User role for the user ${foundAdmin2User.login} was changed.`);
      assert.ok(foundTechnicalUser.role === 'Viewer', `User role for the user ${foundTechnicalUser.login} was changed.`);
    } else {
      I.say('This testcase is for PMM version 2.27.0 and higher');
    }
  },
);

Scenario(
  'Verify PMM is connected and user can disconnect an reconnect PMM server to the Portal @not-ui-pipeline @post-pmm-portal-upgrade',
  async ({
    I, perconaPlatformPage, homePage, portalAPI,
  }) => {
    if (pmmVersion >= 27 || pmmVersion === undefined) {
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

      perconaPlatformPage.connectToPortal(adminToken, `Test Server ${Date.now()}`);
    } else {
      I.say('This testcase is for PMM version 2.27.0 and higher');
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
    if (newAdminUser) {
      await portalAPI.oktaDeleteUserByEmail(newAdminUser.email);
    }
  },
);
