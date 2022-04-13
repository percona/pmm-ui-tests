const { pmmSettingsPage } = inject();

const {
  buttons, elements, fields, url, messages,
} = pmmSettingsPage.perconaPlatform;

const email = secret(process.env.PORTAL_USER_EMAIL);
const password = secret(process.env.PORTAL_USER_PASSWORD);

Feature('Percona Platform');

Before(async ({ I }) => {
  await I.Authorize();
  I.amOnPage(url);
  I.waitForVisible(elements.connectForm, 30);
});

Scenario(
  'PMM-T398 PMM-T809 Verify Connect to Percona Portal @platform @settings',
  async ({ I, links }) => {
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

// Skip until there's a way to disconnect and portal API is working
// without the need for PERCONA_SSO env variables
xScenario(
  'PMM-T413 Verify user is able to Connect @platform @settings',
  async () => {
    await pmmSettingsPage.perconaPlatform.connect('Test name', email, password);
  },
);
