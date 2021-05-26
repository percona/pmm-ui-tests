const faker = require('faker');

const { I } = inject();

const email = secret(process.env.PORTAL_USER_EMAIL);
const password = secret(process.env.PORTAL_USER_PASSWORD);

const errorCreatingAccount = 'Error Creating Your Account.';

Feature('Percona Platform');

Before(async ({ I, pmmSettingsPage, platformAPI }) => {
  await platformAPI.signOut();
  await I.Authorize();
  I.amOnPage(pmmSettingsPage.perconaPlatform);
  I.waitForVisible('$sign-in-form', 30);
});

After(async ({ platformAPI }) => {
  await platformAPI.signOut();
});

Scenario(
  'PMM-T398 PMM-T809 Verify Sign in form and validation @platform @settings',
  async ({ I, links }) => {
    // Verify elements in login form
    I.seeTextEquals('Login', 'legend');
    I.seeTextEquals('Email', '$email-field-label');
    I.seeInField('$email-text-input', '');
    I.seeTextEquals('Password', '$password-field-label');
    I.seeInField('$password-password-input', '');
    I.seeAttributesOnElements('$sign-in-forgot-password-button', { href: links.forgotPassword });
    I.seeAttributesOnElements('$sign-in-submit-button', { disabled: true });
    I.seeAttributesOnElements('$sign-in-to-sign-up-button', { disabled: null });
    I.seeTextEquals('Sign up', '$sign-in-to-sign-up-button');

    // Focus on Email and Password fields to verify that fields are required
    I.usePlaywrightTo('focus on email and password fields', async ({ page }) => {
      page.focus('[data-qa="email-text-input"]');
      page.focus('[data-qa="password-password-input"]');
      page.focus('[data-qa="sign-in-to-sign-up-button"]');
    });

    verifyEmailFieldValidation();

    // Password validation
    I.seeTextEquals('Required field', '$password-field-error-message');

    // Verify there is no validation for "pass" value
    I.appendField('$password-password-input', 'pass');
    I.seeTextEquals('', '$password-field-error-message');
  },
);

Scenario(
  'PMM-T415 PMM-T401 Verify Sign Up form and validation @platform @settings',
  async ({ I, links }) => {
    // Open Sign Up Form
    I.click('$sign-in-to-sign-up-button');
    I.waitForVisible('$sign-up-form', 30);

    // Verify elements in Sign Up form
    I.seeTextEquals('Sign up', 'legend');
    I.seeTextEquals('Email', '$email-field-label');
    I.seeInField('$email-text-input', '');
    I.seeTextEquals('First name', '$firstName-field-label');
    I.seeInField('$firstName-text-input', '');
    I.seeTextEquals('Last name', '$lastName-field-label');
    I.seeInField('$lastName-text-input', '');

    I.seeTextEquals('Check here to indicate that you have read and agree to the \n'
          + 'Terms of Service\n'
          + ' and \n'
          + 'Privacy Policy', '$sign-up-agreement-checkbox-label');

    // Verify Terms of Service and Privacy Policy links
    await within('$sign-up-agreement-checkbox-label', () => {
      I.seeAttributesOnElements(locate('a').first(), { href: links.termsOfService });
      I.seeTextEquals('Terms of Service', locate('a').first());
      I.seeAttributesOnElements(locate('a').last(), { href: links.privacyPolicy });
      I.seeTextEquals('Privacy Policy', locate('a').last());
    });

    // Verify Sign Up button is disabled and Back to Login button is present and enabled
    I.seeAttributesOnElements('$sign-up-submit-button', { disabled: true });
    I.seeTextEquals('Back to login', '$sign-up-to-sign-in-button');
    I.seeAttributesOnElements('$sign-up-to-sign-in-button', { disabled: null });

    // Focus on Email, First Name, Last Name fields and terms checkbox to verify that fields are required
    I.usePlaywrightTo('focus on email and password fields', async ({ page }) => {
      page.focus('[data-qa="email-text-input"]');
      page.focus('[data-qa="firstName-text-input"]');
      page.focus('[data-qa="lastName-text-input"]');
      page.focus('[data-qa="agreement-checkbox-input"]');
    });

    verifyEmailFieldValidation();

    // First Name validation
    I.seeTextEquals('Required field', '$firstName-field-error-message');

    // Verify there is no validation for not empty field
    I.appendField('$firstName-text-input', 'First');
    I.seeTextEquals('', '$firstName-field-error-message');

    I.appendField('$firstName-text-input', 'First');

    // Last Name validation
    I.seeTextEquals('Required field', '$lastName-field-error-message');

    // Verify there is no validation for not empty field
    I.appendField('$lastName-text-input', 'Last');
    I.seeTextEquals('', '$lastName-field-error-message');

    // Terms checkbox validation
    I.seeTextEquals('Required field', '$agreement-field-error-message');

    // Verify there is no validation message if checkbox is checked and Sign Up button is enabled
    I.seeAttributesOnElements('$sign-up-submit-button', { disabled: true });
    I.forceClick('$agreement-checkbox-input');
    I.seeAttributesOnElements('$sign-up-submit-button', { disabled: null });
  },
);

Scenario(
  'PMM-T413 Verify user is able to Sign In @platform @settings',
  async () => {
    // Sign In and verify it was successful
    await login(email, password);
  },
);

Scenario(
  'PMM-T413 Verify user is able to Sign Out @platform @settings',
  async ({ I, platformAPI }) => {
    await platformAPI.signIn();

    I.refreshPage();
    I.waitForVisible('$logged-in-wrapper');
    await within('$logged-in-wrapper', async () => {
      I.seeTextEquals('Percona Platform Account', 'header');
      I.seeTextEquals('You are logged in as', locate('p').first());
      I.waitForText(email, 10, '$logged-in-email');
      I.seeTextEquals('Logout', '$logged-in-sign-out-link');
    });

    I.click('$logged-in-sign-out-link');

    I.verifyPopUpMessage('Signed out successfully');

    I.waitForVisible('$sign-in-form');
    I.refreshPage();
    I.waitForVisible('$sign-in-form');
  },
);

Scenario(
  'PMM-T399 Verify user is able to Sign Up @platform @settings',
  async ({ I }) => {
    I.click('$sign-in-to-sign-up-button');

    I.waitForVisible('$sign-up-form', 30);

    const newUserEmail = await I.generateNewEmail();
    const newUserPassword = 'MySuperSecretTempPassword123321';

    I.fillField('$email-text-input', newUserEmail);
    I.fillField('$firstName-text-input', faker.name.firstName());
    I.fillField('$lastName-text-input', faker.name.lastName());

    I.forceClick('$agreement-checkbox-input');

    I.click('$sign-up-submit-button');

    I.verifyPopUpMessage('An account activation email has been sent to you');

    await activateAccount(newUserEmail, newUserPassword);
    await login(newUserEmail, newUserPassword);
  },
);

Scenario(
  'PMM-T401 Verify user is not able to Sign Up with existing email @platform @settings',
  async ({ I }) => {
    I.click('$sign-in-to-sign-up-button');
    I.waitForVisible('$sign-up-form', 30);
    submitSignUpForm(email);
    I.verifyPopUpMessage(errorCreatingAccount);
  },
);

const login = async (email, password) => {
  I.fillField('$email-text-input', email);
  I.fillField('$password-password-input', password);
  I.seeAttributesOnElements('$sign-in-submit-button', { disabled: null });
  I.click('$sign-in-submit-button');
  I.verifyPopUpMessage(`You are signed in as ${email}`);
  I.dontSeeElement('$sign-in-form');
  I.seeElement('$logged-in-wrapper');
  I.refreshPage();
  I.waitForVisible('$logged-in-wrapper', 20);

  await within('$logged-in-wrapper', async () => {
    I.seeTextEquals('Percona Platform Account', 'header');
    I.seeTextEquals('You are logged in as', locate('p').first());
    I.waitForText(email, 10, '$logged-in-email');
    I.seeTextEquals('Logout', '$logged-in-sign-out-link');
  });
};

const activateAccount = async (email, password) => {
  const messageLinks = (await I.getLastMessage(email)).html.links;
  const activationLink = messageLinks.find(({ text }) => text.trim() === 'Activate').href;

  I.openNewTab();
  I.amOnPage(activationLink);
  I.waitForVisible('[name="newPassword"]', 20);
  I.fillField('[name="newPassword"]', password);
  I.fillField('[name="verifyPassword"]', password);
  I.click('#next-button');
  I.waitForVisible('[data-se="user-menu"]', 30);
  I.seeInCurrentUrl('/app/UserHome');
  I.closeCurrentTab();
};

const submitSignUpForm = (email) => {
  I.fillField('$email-text-input', email);
  I.fillField('$firstName-text-input', faker.name.firstName());
  I.fillField('$lastName-text-input', faker.name.lastName());
  I.forceClick('$agreement-checkbox-input');

  I.click('$sign-up-submit-button');
};

const verifyEmailFieldValidation = () => {
  I.clearField('$email-text-input');

  I.seeTextEquals('Required field', '$email-field-error-message');

  // Verify validation message for "email" value
  I.fillField('$email-text-input', 'email');
  I.seeTextEquals('Invalid email address', '$email-field-error-message');

  // Verify validation message for "email@" value
  I.appendField('$email-text-input', '@');
  I.seeTextEquals('Invalid email address', '$email-field-error-message');

  // Verify validation message for "email@domain#.com" value
  I.appendField('$email-text-input', 'domain#.com');
  I.seeTextEquals('Invalid email address', '$email-field-error-message');

  // Verify there is no validation for "email@domain.com" value
  I.clearField('$email-text-input');
  I.appendField('$email-text-input', 'email@domain.com');
  I.seeTextEquals('', '$email-field-error-message');
};
