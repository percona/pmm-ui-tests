Feature('Portal Integration with PMM');

let newUser = {};

AfterSuite(async ({ I }) => {
  const users = await I.listUsers();
  const result = users.users.filter((user) => user.email === newUser.email);

  await I.deleteUser(result[0].id);
});

Scenario(
  'PMM-T1097 Verify PMM server is connected to Portal @platform',
  async ({
    I, pmmSettingsPage, portalAPI, homePage,
  }) => {
    const serviceNowUsers = portalAPI.createServiceNowUsers();

    // eslint-disable-next-line no-console
    console.log(serviceNowUsers);
    await I.Authorize();
    pmmSettingsPage.openAdvancedSettings();
    const publicAddress = await I.grabValueFrom(pmmSettingsPage.fields.publicAddressInput);

    if (publicAddress.length !== 0) pmmSettingsPage.clearPublicAddress();

    pmmSettingsPage.addPublicAddress();
    newUser = await portalAPI.getUser();
    await portalAPI.oktaCreateUser(newUser);
    const userToken = await portalAPI.getUserAccessToken(newUser.email, newUser.password);

    await portalAPI.apiCreateOrg(userToken);
    I.amOnPage(pmmSettingsPage.perconaPlatform);
    await pmmSettingsPage.connectPmmToPerconaPortal(newUser.email, newUser.password);
  },
);

Scenario(
  'PMM-T1098 Verify login using Percona Platform account @platform',
  async ({
    I, homePage,
  }) => {
    I.amOnPage('/');
    await I.loginWithSSO(newUser.email, newUser.password);
    I.waitInUrl(homePage.landingUrl);
  },
);

Scenario(
  'PMM-T1112 Verify user can disconnect pmm from portal success flow @platform',
  async ({
    I, pmmSettingsPage, homePage, portalAPI
  }) => {
    I.amOnPage('/');
    await I.loginWithSSO(newUser.email, newUser.password);
    I.waitInUrl(homePage.landingUrl);
    I.amOnPage(pmmSettingsPage.perconaPlatform);
    await pmmSettingsPage.disconnectPmmFromPerconaPortal();
    await I.unAuthorize();
    I.amOnPage('/');
    I.dontSeeElement(locate('a').withAttr({ href: 'login/generic_oauth' }));
    I.amOnPage(portalAPI.oktaUrl);
    I.loginWithSSO(newUser.email, newUser.password, false);
    I.amOnPage('/');
    I.seeElement(locate('h1').withText('Percona Monitoring and Management'));
  },
);
