Feature('Portal Integration with PMM');

let newUser = {};

AfterSuite(async ({ I }) => {
  const users = await I.listUsers();
  const result = users.users.filter((user) => user.email === newUser.email);

  await I.deleteUser(result[0].id);
});

Scenario(
  'PMM-T398 PMM-T809 Verify Connect to Percona Portal @platform elements @settings',
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
    await I.unAuthorize();
    I.amOnPage('');
    I.dontSeeElement(locate('a').withAttr({ href: 'login/generic_oauth' }));
    I.amOnPage(homePage.genericOauthUrl);
    I.seeElement(locate('div').withText('OAuth not enabled'));
    I.amOnPage('');
    I.seeElement(locate('h1').withText('Percona Monitoring and Management'));
  },
);
