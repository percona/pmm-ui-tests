Feature('Portal Integration with PMM');

let newUser = {};
const mailosaurId = process.env.MAILOSAUR_SERVER_ID;

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
  'PMM-T1098 Verify login using Percona Platform account @portal',
  async ({
    I, homePage,
  }) => {
    I.amOnPage('');
    await I.loginWithSSO(newUser.email, newUser.password);
    I.waitInUrl(homePage.landingUrl);
  },
);

Scenario(
  'PMM-T1151 Verify invited user to the organization is able to login with SSO @portal',
  async ({
    I, portalAPI, homePage, perconaPlatformPage,
  }) => {
    const invitedUser = await portalAPI.getUser();

    invitedUser.email = `${invitedUser.firstName}.${invitedUser.lastName}@${mailosaurId}.mailosaur.net`;
    const newUserToken = await portalAPI.getUserAccessToken(newUser.email, newUser.password);
    const org = await portalAPI.apiGetOrg(newUserToken);

    await portalAPI.apiInviteOrgMember(newUserToken, org[0].id,
      { username: invitedUser.email, role: 'Admin' });
    const email = await I.listMessages();
    const filteredEmails = await email.items
      .find((message) => message.subject === 'Welcome to Percona Platform!'
      && message.to[0].email === invitedUser.email);
    const foundMessage = await I.getMessageById(filteredEmails.id, 60000);

    I.amOnPage(foundMessage.html.links.find((link) => link.text.trim() === 'Activate').href);
    perconaPlatformPage.activateUser(invitedUser.password);
    I.waitInUrl(perconaPlatformPage.portalDevUrl);
    I.amOnPage('/');
    I.click(locate('a').withAttr({ href: 'login/generic_oauth' }));
    I.waitInUrl(homePage.landingUrl);
    await I.unAuthorize();
  },
);

Scenario(
  'PMM-T1112 Verify user can disconnect pmm from portal success flow @portal',
  async ({
    I, homePage, portalAPI, perconaPlatformPage,
  }) => {
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
