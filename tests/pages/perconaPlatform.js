const faker = require('faker');

const { I } = inject();

module.exports = {
  url: 'graph/settings/percona-platform',
  elements: {
    signInForm: '$sign-in-form',
    signUpForm: '$sign-up-form',
    emailFieldLabel: '$email-field-label',
    emailValidation: '$email-field-error-message',
    passwordFieldLabel: '$password-field-label',
    passwordValidation: '$password-field-error-message',
    firstNameFieldLabel: '$firstName-field-label',
    firstNameValidation: '$firstName-field-error-message',
    lastNameFieldLabel: '$lastName-field-label',
    lastNameValidation: '$lastName-field-error-message',
    termsCheckboxLabel: '$sign-up-agreement-checkbox-label',
    termsCheckboxValidation: '$agreement-field-error-message',
    loggedInForm: '$logged-in-wrapper',
    loggedInEmail: '$logged-in-email',
  },
  fields: {
    emailField: '$email-text-input',
    passwordField: '$password-password-input',
    firstNameField: '$firstName-text-input',
    lastNameField: '$lastName-text-input',
  },
  buttons: {
    signIn: '$sign-in-submit-button',
    signUp: '$sign-up-submit-button',
    forgotPasswordLink: '$sign-in-forgot-password-button',
    termsCheckBox: '$agreement-checkbox-input',
    goToSignUp: '$sign-in-to-sign-up-button',
    backToSignIn: '$sign-up-to-sign-in-button',
    signOut: '$logged-in-sign-out-link',
  },
  messages: {
    termsText: 'Check here to indicate that you have read and agree to the \n'
        + 'Terms of Service\n'
        + ' and \n'
        + 'Privacy Policy',
    requiredField: 'Required field',
    invalidEmail: 'Invalid email address',
    signedIn: (email) => `You are signed in as ${email}`,
    signedOut: 'Signed out successfully',
    activationLinkWasSent: 'An account activation email has been sent to you',
    errorCreatingAccount: 'Error Creating Your Account.',
  },

  async login(email, password) {
    I.fillField(this.fields.emailField, email);
    I.fillField(this.fields.passwordField, password);
    I.seeAttributesOnElements(this.buttons.signIn, { disabled: null });
    I.click(this.buttons.signIn);
    I.verifyPopUpMessage(this.messages.signedIn(email));
    I.dontSeeElement(this.elements.signInForm);
    I.seeElement(this.elements.loggedInForm);
    I.refreshPage();
    I.waitForVisible(this.elements.loggedInForm, 3);

    await this.verifyUserIsLoggedIn(email);
  },

  async verifyUserIsLoggedIn(email) {
    I.waitForVisible(this.elements.loggedInForm, 3);
    await within(this.elements.loggedInForm, async () => {
      I.seeTextEquals('Percona Platform Account', 'header');
      I.seeTextEquals('You are logged in as', locate('p').first());
      I.waitForText(email, 10, this.elements.loggedInEmail);
      I.seeTextEquals('Logout', this.buttons.signOut);
    });
  },

  async activateAccount(email, password) {
    const messageLinks = (await I.getLastMessage(email)).html.links;
    const activationLink = messageLinks.find(({ text }) => text.trim() === 'Activate').href;

    I.openNewTab();
    I.amOnPage(activationLink);
    I.waitForVisible('[name="newPassword"]', 3);
    I.fillField('[name="newPassword"]', password);
    I.fillField('[name="verifyPassword"]', password);
    I.click('#next-button');
    I.waitForVisible('[data-se="org-logo"]', 3);
    I.waitForVisible('[data-se="dropdown-menu-button-header"]', 3);
    I.seeInCurrentUrl('/app/UserHome');
    I.closeCurrentTab();
  },

  submitSignUpForm(email) {
    I.fillField(this.fields.emailField, email);
    I.fillField(this.fields.firstNameField, faker.name.firstName());
    I.fillField(this.fields.lastNameField, faker.name.lastName());
    I.forceClick(this.buttons.termsCheckBox);

    I.click(this.buttons.signUp);
  },

  verifyEmailFieldValidation() {
    I.clearField(this.fields.emailField);

    I.seeTextEquals(this.messages.requiredField, this.elements.emailValidation);

    // Verify validation message for "email" value
    I.fillField(this.fields.emailField, 'email');
    I.seeTextEquals(this.messages.invalidEmail, this.elements.emailValidation);

    // Verify validation message for "email@" value
    I.appendField(this.fields.emailField, '@');
    I.seeTextEquals(this.messages.invalidEmail, this.elements.emailValidation);

    // Verify validation message for "email@domain#.com" value
    I.appendField(this.fields.emailField, 'domain#.com');
    I.seeTextEquals(this.messages.invalidEmail, this.elements.emailValidation);

    // Verify there is no validation error for "email@domain.com" value
    I.clearField(this.fields.emailField);
    I.appendField(this.fields.emailField, 'email@domain.com');
    I.seeTextEquals('', this.elements.emailValidation);
  },
};
