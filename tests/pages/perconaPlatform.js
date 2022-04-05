const faker = require('faker');

const { I } = inject();

module.exports = {
  url: 'graph/settings/percona-platform',
  elements: {
    techPreviewLabel: locate('h1'),
    connectForm: '$connect-form',
    pmmServerNameFieldLabel: '$pmmServerName-field-label',
    pmmServerNameValidation: '$pmmServerName-field-error-message',
    accessTokenLabel: '$accessToken-field-label',
    accessTokenValidation: '$accessToken-field-error-message',
    connectedWrapper: '$connected-wrapper',
    getAccessTokenLink: locate('a').after('$accessToken-field-container'),
  },
  fields: {
    pmmServerNameField: '$pmmServerName-text-input',
    accessToken: '$accessToken-text-input',
    serverId: '$pmmServerId-text-input',
  },
  buttons: {
    connect: '$connect-button',
  },
  messages: {
    technicalPreview: ' This feature is in Technical Preview stage',
    requiredField: 'Required field',
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
};
