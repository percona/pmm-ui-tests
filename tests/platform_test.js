const { generate } = require('generate-password');

const getPassword = () => generate({
  length: 10,
  numbers: true,
  lowercase: true,
  uppercase: true,
  strict: true,
});

const { pmmSettingsPage } = inject();

const {
  buttons, elements, fields, url, messages,
} = pmmSettingsPage.perconaPlatform;

const email = secret(process.env.PORTAL_USER_EMAIL);
const password = process.env.PORTAL_USER_PASSWORD;

Feature('Percona Platform');

Before(async ({ I, platformAPI }) => {
  await platformAPI.signOut();
  await I.Authorize();
  I.amOnPage(url);
  I.waitForVisible(elements.signInForm, 30);
});

After(async ({ platformAPI }) => {
  await platformAPI.signOut();
});

Scenario(
  'PMM-T398 PMM-T809 Verify Sign in form and validation @platform @settings',
  async ({ I, links }) => {
    // Verify elements in login form
    I.seeTextEquals('Login', 'legend');
    I.seeTextEquals('Email', elements.emailFieldLabel);
    I.seeInField(fields.emailField, '');
    I.seeTextEquals('Password', elements.passwordFieldLabel);
    I.seeInField(fields.passwordField, '');
    I.seeAttributesOnElements(buttons.forgotPasswordLink, { href: links.forgotPassword });
    I.seeAttributesOnElements(buttons.signIn, { disabled: true });
    I.seeAttributesOnElements(buttons.goToSignUp, { disabled: null });
    I.seeTextEquals('Sign up', buttons.goToSignUp);

    // Focus on Email and Password fields to verify that fields are required
    I.usePlaywrightTo('focus on email and password fields', async ({ page }) => {
      page.focus(I.useDataQA('email-text-input'));
      page.focus(I.useDataQA('password-password-input'));
      page.focus(I.useDataQA('sign-in-to-sign-up-button'));
    });

    pmmSettingsPage.perconaPlatform.verifyEmailFieldValidation();

    // Password validation
    I.seeTextEquals(messages.requiredField, elements.passwordValidation);

    // Verify there is no validation for "pass" value
    I.appendField(fields.passwordField, 'pass');
    I.seeTextEquals('', elements.passwordValidation);
  },
);

Scenario(
  'PMM-T415 PMM-T842 Verify Sign Up form and validation @platform @settings @grafana-pr',
  async ({ I, links }) => {
    // Open Sign Up Form
    I.click(buttons.goToSignUp);
    I.waitForVisible(elements.signUpForm, 30);

    // Verify elements in Sign Up form
    I.seeTextEquals('Sign up', 'legend');
    I.seeTextEquals('Email', elements.emailFieldLabel);
    I.seeInField(fields.emailField, '');
    I.seeTextEquals('First name', elements.firstNameFieldLabel);
    I.seeInField(fields.firstNameField, '');
    I.seeTextEquals('Last name', elements.lastNameFieldLabel);
    I.seeInField(fields.lastNameField, '');

    I.seeTextEquals(messages.termsText, elements.termsCheckboxLabel);

    // Verify Terms of Service and Privacy Policy links
    await within(elements.termsCheckboxLabel, () => {
      I.seeAttributesOnElements(locate('a').first(), { href: links.termsOfService });
      I.seeTextEquals('Terms of Service', locate('a').first());
      I.seeAttributesOnElements(locate('a').last(), { href: links.privacyPolicy });
      I.seeTextEquals('Privacy Policy', locate('a').last());
    });

    // Verify Sign Up button is disabled and Back to Login button is present and enabled
    I.seeAttributesOnElements(buttons.signUp, { disabled: true });
    I.seeTextEquals('Back to login', buttons.backToSignIn);
    I.seeAttributesOnElements(buttons.backToSignIn, { disabled: null });

    // Focus on Email, First Name, Last Name fields and terms checkbox to verify that fields are required
    I.usePlaywrightTo('focus on email and password fields', async ({ page }) => {
      page.focus(I.useDataQA('email-text-input'));
      page.focus(I.useDataQA('firstName-text-input'));
      page.focus(I.useDataQA('lastName-text-input'));
      page.focus(I.useDataQA('agreement-checkbox-input'));
    });

    pmmSettingsPage.perconaPlatform.verifyEmailFieldValidation();

    // First Name validation
    I.seeTextEquals(messages.requiredField, elements.firstNameValidation);

    // Verify there is no validation for not empty field
    I.appendField(fields.firstNameField, 'First');
    I.seeTextEquals('', elements.firstNameValidation);

    // Last Name validation
    I.seeTextEquals(messages.requiredField, elements.lastNameValidation);

    // Verify there is no validation for not empty field
    I.appendField(fields.lastNameField, 'Last');
    I.seeTextEquals('', elements.lastNameValidation);

    // Terms checkbox validation
    I.seeTextEquals(messages.requiredField, elements.termsCheckboxValidation);

    // Verify there is no validation message if checkbox is checked and Sign Up button is enabled
    I.seeAttributesOnElements(buttons.signUp, { disabled: true });
    I.forceClick(buttons.termsCheckBox);
    I.seeAttributesOnElements(buttons.signUp, { disabled: null });
  },
);

Scenario(
  'PMM-T413 Verify user is able to Login @platform @settings',
  async () => {
    // Sign In and verify it was successful
    await pmmSettingsPage.perconaPlatform.login(email, password);
  },
);

Scenario(
  'PMM-T416 Verify user is able to Sign Out @platform @settings',
  async ({ I, platformAPI }) => {
    await platformAPI.signIn();

    // Verify user is logged in
    I.refreshPage();
    await pmmSettingsPage.perconaPlatform.verifyUserIsLoggedIn(email);

    // Click Sign Out and verify Pop Up message
    I.click(buttons.signOut);
    I.verifyPopUpMessage(messages.signedOut);

    // Verify after refresh user still see login form
    I.waitForVisible(elements.signInForm);
    I.refreshPage();
    I.waitForVisible(elements.signInForm);
  },
);

// Skipping due to changes on sign up process
xScenario(
  'PMM-T399 PMM-T843 Verify user is able to Sign Up and login with new account @platform @settings',
  async ({ I }) => {
    I.click(buttons.goToSignUp);
    I.waitForVisible(elements.signUpForm, 30);

    const newUserEmail = await I.generateNewEmail();
    const newUserPassword = `${getPassword()} with spaces`;

    // Fill Sign Up fields, accept Terms agreement and submit a form
    pmmSettingsPage.perconaPlatform.submitSignUpForm(newUserEmail);
    I.verifyPopUpMessage(messages.activationLinkWasSent);

    // Activate account and login with new account
    await pmmSettingsPage.perconaPlatform.activateAccount(newUserEmail, newUserPassword);
    await pmmSettingsPage.perconaPlatform.login(newUserEmail, newUserPassword);
  },
);

Scenario(
  'PMM-T401 Verify user is not able to Sign Up with existing email @platform @settings',
  async ({ I }) => {
    I.click(buttons.goToSignUp);
    I.waitForVisible(elements.signUpForm, 30);
    pmmSettingsPage.perconaPlatform.submitSignUpForm(email);
    I.verifyPopUpMessage(messages.errorCreatingAccount);
  },
);
