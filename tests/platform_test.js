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
  async ({ I }) => {
    // Verify elements in login form
    I.seeTextEquals('Connect PMM to Percona Platform', 'legend');
    I.seeTextEquals('PMM Server Name *', elements.pmmServerNameFieldLabel);
    I.seeTextEquals('Percona Account (email) *', elements.emailFieldLabel);
    I.seeInField(fields.emailField, '');
    I.seeTextEquals('Password *', elements.passwordFieldLabel);
    I.seeInField(fields.passwordField, '');
    I.seeAttributesOnElements(buttons.connect, { disabled: true });

    // Focus on PMM Server Name, Email and Password fields to verify that fields are required
    I.usePlaywrightTo('focus on PMM server name, email and password fields', async ({ page }) => {
      page.focus(I.useDataQA('pmmServerName-text-input'));
      page.focus(I.useDataQA('email-text-input'));
      page.focus(I.useDataQA('password-password-input'));
      page.focus(I.useDataQA('connect-button'));
    });

    pmmSettingsPage.perconaPlatform.verifyEmailFieldValidation();

    // Password validation
    I.seeTextEquals(messages.requiredField, elements.passwordValidation);

    // Verify there is no validation for "pass" value
    I.appendField(fields.passwordField, 'pass');
    I.seeTextEquals('', elements.passwordValidation);
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

Scenario(
  'PMM-T1104 - Verify that Percona Platform is marked as Technical preview @platform @settings',
  async ({ I }) => {
    I.seeTextEquals(messages.technicalPreview, elements.techPreviewLabel);
  },
);
