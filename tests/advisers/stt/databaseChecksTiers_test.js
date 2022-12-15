Feature('All Checks Tiers tests');

let pmmVersion;
let grafana_session_cookie;
let freeUser;
let freeUserToken;
let freUserOrg;
let adminToken;
let serviceNowUsers;
let customerOrg;

BeforeSuite(async ({
  homePage, settingsAPI,
}) => {
  pmmVersion = await homePage.getVersions().versionMinor;
  if (pmmVersion < 28) {
    await settingsAPI.changeSettings({ stt: true });
  }
});

AfterSuite(async ({ portalAPI }) => {
  await portalAPI.disconnectPMMFromPortal(grafana_session_cookie);

  if (customerOrg) {
    await portalAPI.apiDeleteOrg(customerOrg.id, adminToken);
  }

  if (serviceNowUsers) {
    await portalAPI.oktaDeleteUserByEmail(serviceNowUsers.admin1.email);
  }

  if (freUserOrg) {
    await portalAPI.apiDeleteOrg(freUserOrg.id, freeUserToken);
  }

  if (freeUser) {
    await portalAPI.oktaDeleteUserByEmail(freeUser.email);
  }
});

Scenario(
  'PMM-T1202 Verify that Advisors reflect on user authority / platform role changes @stt',
  async ({
    I, pmmSettingsPage, databaseChecksPage, portalAPI, homePage, settingsAPI, loginPage,
  }) => {
    I.say('Checks for Anonymous user');
    await I.Authorize();
    pmmSettingsPage.openAdvancedSettings();
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    const publicAddress = await I.grabValueFrom(pmmSettingsPage.fields.publicAddressInput);

    if (publicAddress.length !== 0) pmmSettingsPage.clearPublicAddress();

    pmmSettingsPage.addPublicAddress();

    I.amOnPage(databaseChecksPage.allChecks);
    await I.waitForVisible(databaseChecksPage.elements.allChecksTable);

    databaseChecksPage.checks.anonymous.forEach((check) => {
      databaseChecksPage.verifyAdvisorCheckExistence(check);
    });
    databaseChecksPage.checks.registered.forEach((check) => {
      databaseChecksPage.verifyAdvisorCheckIsNotPresent(check);
    });
    databaseChecksPage.checks.registeredOnly.forEach((check) => {
      databaseChecksPage.verifyAdvisorCheckIsNotPresent(check);
    });
    databaseChecksPage.checks.paid.forEach((check) => {
      databaseChecksPage.verifyAdvisorCheckIsNotPresent(check);
    });
    freeUser = await portalAPI.getUser();

    await portalAPI.oktaCreateUser(freeUser);
    freeUserToken = await portalAPI.getUserAccessToken(freeUser.email, freeUser.password);

    freUserOrg = await portalAPI.apiCreateOrg(freeUserToken);
    await portalAPI.connectPMMToPortal(freeUserToken);
    await I.unAuthorize();
    I.wait(5);
    I.refreshPage();
    I.say('Checks for Registered user');
    if (pmmVersion < 28) {
      await settingsAPI.changeSettings({ stt: false });
      await settingsAPI.changeSettings({ stt: true });
    }

    await I.loginWithSSO(freeUser.email, freeUser.password);
    I.waitInUrl(databaseChecksPage.allChecks);
    grafana_session_cookie = await I.getBrowserGrafanaSessionCookies();
    await I.waitForVisible(databaseChecksPage.elements.allChecksTable);

    databaseChecksPage.checks.anonymous.forEach((check) => {
      databaseChecksPage.verifyAdvisorCheckExistence(check);
    });
    databaseChecksPage.checks.registered.forEach((check) => {
      databaseChecksPage.verifyAdvisorCheckExistence(check);
    });
    databaseChecksPage.checks.registeredOnly.forEach((check) => {
      databaseChecksPage.verifyAdvisorCheckExistence(check);
    });
    databaseChecksPage.checks.paid.forEach((check) => {
      databaseChecksPage.verifyAdvisorCheckIsNotPresent(check);
    });

    await portalAPI.disconnectPMMFromPortal(grafana_session_cookie);
    await I.unAuthorize();
    await I.waitInUrl(loginPage.url);
    serviceNowUsers = await portalAPI.createServiceNowUsers();

    await portalAPI.oktaCreateUser(serviceNowUsers.admin1);
    adminToken = await portalAPI.getUserAccessToken(serviceNowUsers.admin1.email, serviceNowUsers.admin1.password);

    customerOrg = await portalAPI.apiCreateOrg(adminToken);
    await portalAPI.connectPMMToPortal(adminToken);
    I.wait(5);
    I.amOnPage('');
    I.say('Checks for Paid user');
    if (pmmVersion < 28) {
      await settingsAPI.changeSettings({ stt: false });
      await settingsAPI.changeSettings({ stt: true });
    }

    await I.loginWithSSO(serviceNowUsers.admin1.email, serviceNowUsers.admin1.password);
    I.waitInUrl(homePage.landingUrl);
    grafana_session_cookie = await I.getBrowserGrafanaSessionCookies();
    I.amOnPage(databaseChecksPage.allChecks);
    await I.waitForVisible(databaseChecksPage.elements.allChecksTable);

    databaseChecksPage.checks.anonymous.forEach((check) => {
      databaseChecksPage.verifyAdvisorCheckExistence(check);
    });
    databaseChecksPage.checks.registered.forEach((check) => {
      databaseChecksPage.verifyAdvisorCheckExistence(check);
    });
    databaseChecksPage.checks.paid.forEach((check) => {
      databaseChecksPage.verifyAdvisorCheckExistence(check);
    });

    await I.unAuthorize();
    await I.waitInUrl(loginPage.url);
    if (pmmVersion < 28) {
      await settingsAPI.changeSettings({ stt: false });
    }
  },
);
