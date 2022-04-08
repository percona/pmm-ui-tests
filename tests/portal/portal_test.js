Feature('Portal Integration with PMM');

let newUser = {};

AfterSuite(async ({ I }) => {
  console.log(`Test ran for user: ${newUser.email} with password: ${newUser.password}`);
  const users = await I.listUsers();
  const result = users.users.filter((user) => user.email === newUser.email);

  await I.deleteUser(result[0].id);
});

Scenario(
  'PMM-T1097 Verify PMM server is connected to Portal @portal',
  async ({
    I, pmmSettingsPage, portalAPI, perconaPlatformPage,
  }) => {
    await I.Authorize();
    pmmSettingsPage.openAdvancedSettings();
    const publicAddress = await I.grabValueFrom(pmmSettingsPage.fields.publicAddressInput);

    if (publicAddress.length !== 0) pmmSettingsPage.clearPublicAddress();

    pmmSettingsPage.addPublicAddress();
    perconaPlatformPage.openPerconaPlatform();
    newUser = await portalAPI.getUser();
    await portalAPI.oktaCreateUser(newUser);
    const userToken = await portalAPI.getUserAccessToken(newUser.email, newUser.password);

    await portalAPI.apiCreateOrg(userToken);
    await perconaPlatformPage.openPerconaPlatform();
    await perconaPlatformPage.connectToPortal(userToken, `Test Server ${Date.now()}`);
  },
);

Scenario(
  'PMM-T1098 Verify login using Percona Platform account @portal',
  async ({
    I, homePage,
  }) => {
    I.amOnPage('');
    await I.loginWithSSO(newUser.email, newUser.password);
    I.click('//input[@id="okta-signin-submit"]');
    I.waitInUrl(homePage.landingUrl);
  },
);

Scenario(
  'PMM-T1112 Verify user can disconnect pmm from portal success flow @portal',
  async ({
    I, homePage, portalAPI, perconaPlatformPage,
  }) => {
    I.amOnPage('');
    await I.loginWithSSO(newUser.email, newUser.password);
    I.click('//input[@id="okta-signin-submit"]');
    I.waitInUrl(homePage.landingUrl);
    I.amOnPage(perconaPlatformPage.url);
    await perconaPlatformPage.disconnectFromPortal();
    await I.unAuthorize();
    I.amOnPage('');
    I.dontSeeElement(locate('a').withAttr({ href: 'login/generic_oauth' }));
    I.amOnPage(portalAPI.oktaUrl);
    I.loginWithSSO(newUser.email, newUser.password, false);
    I.click('//input[@id="okta-signin-submit"]');
    I.amOnPage('');
    I.seeElement(locate('h1').withText('Percona Monitoring and Management'));
  },
);
