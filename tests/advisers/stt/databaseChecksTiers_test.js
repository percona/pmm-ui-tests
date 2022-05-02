Feature('All Checks Tiers tests');

Scenario(
  'PMM-T1202 Verify that Advisors reflect on user authority / platform role changes @stt',
  async ({
    I, pmmSettingsPage, databaseChecksPage, portalAPI, perconaPlatformPage, homePage,
  }) => {
    /* Checks for Anonymous user  */
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
    const freeUser = await portalAPI.getUser();

    await portalAPI.oktaCreateUser(freeUser);
    const freeUserToken = await portalAPI.getUserAccessToken(freeUser.email, freeUser.password);

    await portalAPI.apiCreateOrg(freeUserToken);
    await portalAPI.connectPMMToPortal(freeUserToken);
    await I.unAuthorize();
    I.wait(5);
    I.refreshPage();
    /* Checks for Registered user  */
    await I.loginWithSSO(freeUser.email, freeUser.password);
    I.waitInUrl(databaseChecksPage.allChecks);
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

    await perconaPlatformPage.openPerconaPlatform();
    await perconaPlatformPage.disconnect();
    await I.waitInUrl(homePage.landingPage);
    await I.unAuthorize();
    const serviceNowUsers = await portalAPI.createServiceNowUsers();

    await portalAPI.oktaCreateUser(serviceNowUsers.admin1);
    const adminToken = await portalAPI.getUserAccessToken(serviceNowUsers.admin1.email, serviceNowUsers.admin1.password);

    await portalAPI.apiCreateOrg(adminToken);
    await portalAPI.connectPMMToPortal(adminToken);
    I.wait(5);
    I.amOnPage('');
    /* Checks for Paid user  */
    await I.loginWithSSO(serviceNowUsers.admin1.email, serviceNowUsers.admin1.password);
    I.waitInUrl(homePage.landingUrl);
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

    await perconaPlatformPage.openPerconaPlatform();
    await perconaPlatformPage.disconnect();
    await I.waitInUrl(homePage.landingPage);
  },
);
