const faker = require('faker');

const { I } = inject();

const email = process.env.PORTAL_USER_EMAIL;
const password = process.env.PORTAL_USER_PASSWORD;

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
  'Verify user is able to Sign In @platform @settings',
  async ({ I }) => {
    // Verify elements in login form
    I.seeTextEquals('Login', 'legend');
    I.seeTextEquals('Email', '$email-field-label');
    I.seeInField('$email-text-input', '');
    I.seeTextEquals('Password', '$password-field-label');
    I.seeInField('$password-password-input', '');
    I.seeAttributesOnElements('$sign-in-forgot-password-button', { href: 'https://okta.percona.com/signin/forgot-password' });
    I.seeAttributesOnElements('$sign-in-submit-button', { disabled: true });
    I.seeAttributesOnElements('$sign-in-to-sign-up-button', { disabled: null });
    I.seeTextEquals('Sign up', '$sign-in-to-sign-up-button');

    // Do Login and verify it was successful
    login(email, password);

    await within('$logged-in-wrapper', async () => {
      I.seeTextEquals('Percona Platform Account', 'header');
      I.seeTextEquals('You are logged in as', locate('p').first());
      I.seeTextEquals(email, '$logged-in-email');
      I.seeTextEquals('Logout', '$logged-in-sign-out-link');
    });
  },
);

Scenario(
  'PMM-T399 Verify user is able to Sign Up @platform @settings',
  async ({ I }) => {
    I.click('$sign-in-to-sign-up-button');

    I.waitForVisible('$sign-up-form', 30);

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
    await within('$sign-up-agreement-checkbox-label', () => {
      I.seeAttributesOnElements(locate('a').first(), { href: 'https://per.co.na/pmm/platform-terms' });
      I.seeTextEquals('Terms of Service', locate('a').first());
      I.seeAttributesOnElements(locate('a').last(), { href: 'https://per.co.na/pmm/platform-privacy' });
      I.seeTextEquals('Privacy Policy', locate('a').last());
    });

    I.seeAttributesOnElements('$sign-up-submit-button', { disabled: true });
    I.seeTextEquals('Back to login', '$sign-up-to-sign-in-button');

    const newUserEmail = await I.generateNewEmail();
    const newUserPassword = 'MySuperSecretTempPassword123321';

    I.fillField('$email-text-input', newUserEmail);
    I.fillField('$firstName-text-input', faker.name.firstName());
    I.fillField('$lastName-text-input', faker.name.lastName());

    I.seeAttributesOnElements('$sign-up-submit-button', { disabled: true });
    I.forceClick('$agreement-checkbox-input');
    I.seeAttributesOnElements('$sign-up-submit-button', { disabled: null });

    I.click('$sign-up-submit-button');

    I.verifyPopUpMessage('An account activation email has been sent to you');

    await activateAccount(newUserEmail, newUserPassword);
    login(newUserEmail, newUserPassword);
  },
);

const login = (email, password) => {
  I.fillField('$email-text-input', email);
  I.fillField('$password-password-input', password);
  I.seeAttributesOnElements('$sign-in-submit-button', { disabled: null });
  I.click('$sign-in-submit-button');
  I.verifyPopUpMessage(`You are signed in as ${email}`);
  I.dontSeeElement('$sign-in-form');
  I.seeElement('$logged-in-wrapper');
  I.refreshPage();
  I.waitForVisible('$logged-in-wrapper', 20);
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
