Feature('Portal Integration with PMM');

let newUser = {};

AfterSuite(async ({ I }) => {
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
  'PMM-T1112 Verify user can disconnect pmm from portal success flow @portal',
  async ({
    I, homePage, perconaPlatformPage,
  }) => {
    I.say('Also covers: PMM-T1098 Verify login using Percona Platform account');
    I.amOnPage('');
    await I.loginWithSSO(newUser.email, newUser.password);
    I.waitInUrl(homePage.landingUrl);
    I.amOnPage(perconaPlatformPage.url);
    await perconaPlatformPage.disconnectFromPortal();
    await I.waitInUrl('graph/login', 10);
    I.dontSeeElement(locate('a').withAttr({ href: 'login/generic_oauth' }));
    I.amOnPage(homePage.genericOauthUrl);
    I.seeElement(locate('div').withText('OAuth not enabled'));
    I.amOnPage('');
    I.seeElement(locate('h1').withText('Percona Monitoring and Management'));
  },
);
