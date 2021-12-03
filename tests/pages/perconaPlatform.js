const faker = require('faker');

const { I } = inject();

module.exports = {
  url: 'graph/settings/percona-platform',
  elements: {
    connectForm: '$connect-form',
    pmmServerNameFieldLabel: '$pmmServerName-field-label',
    pmmServerNameValidation: '$pmmServerName-field-error-message',
    emailFieldLabel: '$email-field-label',
    emailValidation: '$email-field-error-message',
    passwordFieldLabel: '$password-field-label',
    passwordValidation: '$password-field-error-message',
    connectedWrapper: '$connected-wrapper',
  },
  fields: {
    pmmServerNameField: '$pmmServerName-text-input',
    emailField: '$email-text-input',
    passwordField: '$password-password-input',
  },
  buttons: {
    connect: '$connect-button',
  },
  messages: {
    requiredField: 'Required field',
    invalidEmail: 'Invalid email address',
    connected: 'This PMM instance is connected to Percona Portal.',
    connectedSuccess: 'Successfully connected PMM to Percona Portal',
  },

  async connect(pmmServerName, email, password) {
    I.fillField(this.fields.pmmServerNameField, pmmServerName);
    I.fillField(this.fields.emailField, email);
    I.fillField(this.fields.passwordField, password);
    I.seeAttributesOnElements(this.buttons.connect, { disabled: null });
    I.click(this.buttons.connect);
    I.verifyPopUpMessage(this.messages.connectedSuccess);
    I.refreshPage();
    I.waitForVisible(this.elements.connectedWrapper, 20);
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
