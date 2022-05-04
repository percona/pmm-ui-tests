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
    settingsContent: '$settings-tab-content',
    getAccessTokenLink: locate('a').after('$accessToken-field-container'),
  },
  fields: {
    pmmServerNameField: '$pmmServerName-text-input',
    tokenField: '$accessToken-text-input',
    emailField: '$email-text-input',
    passwordField: '$password-password-input',
    platformConnectButton: '$connect-button',
    platformDisconnectButton: '$disconnect-button',
    accessToken: '$accessToken-text-input',
    serverId: '$pmmServerId-text-input',
    confirmDisconnectButton: locate('button').withAttr({ 'aria-label': 'Confirm Modal Danger Button' }),
  },
  buttons: {
    connect: '$connect-button',
    disconnect: '$disconnect-button',
    confirmDisconnect: locate('button').withAttr({ 'aria-label': 'Confirm Modal Danger Button' }),
  },
  messages: {
    technicalPreview: ' This feature is in Technical Preview stage',
    requiredField: 'Required field',
    invalidEmail: 'Invalid email address',
    connectedSuccess: 'Successfully connected PMM to Percona Platform',
    pmmDisconnectedFromProtal: 'Successfully disconnected PMM from Percona Platform',
    disconnectPMM: 'Disconnect PMM from Percona Platform',
    pmmConnected: 'This PMM instance is connected to Percona Platform.',
  },

  async openPerconaPlatform() {
    I.amOnPage(this.url);
    await this.waitForPerconaPlatformPageLoaded();
  },

  async waitForPerconaPlatformPageLoaded() {
    I.waitForVisible(this.elements.settingsContent, 30);
    I.waitInUrl(this.url);
  },

  async connect(pmmServerName, email, password) {
    I.fillField(this.fields.pmmServerNameField, pmmServerName);
    I.fillField(this.fields.emailField, email);
    I.fillField(this.fields.passwordField, password);
    I.seeAttributesOnElements(this.buttons.connect, { disabled: null });
    I.click(this.buttons.connect);
    I.verifyPopUpMessage(this.messages.connectedSuccess);
    I.refreshPage();
    await this.isPMMConnected();
  },

  async disconnect() {
    I.click(this.buttons.disconnect);
    I.click(this.buttons.confirmDisconnect);
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

  connectToPortal(token, serverName = 'Test Server') {
    I.fillField(this.fields.pmmServerNameField, serverName);
    I.fillField(this.fields.tokenField, token);
    I.click(this.buttons.connect);
    I.verifyPopUpMessage(this.messages.connectedSuccess);
    I.refreshPage();
    I.waitForVisible(this.elements.connectedWrapper, 20);
  },

  disconnectFromPortal(version = 28) {
    I.click(this.fields.platformDisconnectButton);
    if (version >= 28) {
      I.waitForText(this.messages.disconnectPMM);
      I.click(this.fields.confirmDisconnectButton);
    } else {
      I.verifyPopUpMessage(this.messages.pmmDisconnectedFromProtal);
    }
  },

  async isPMMConnected() {
    I.waitForVisible(this.elements.connectedWrapper, 20);
    I.waitForVisible(this.buttons.disconnect);
    locate('p').withText(this.messages.pmmConnected);
  },
};
