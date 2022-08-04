const { I } = inject();
const assert = require('assert');
const perconaPlatformPage_2_26 = require('./perconaPlatformPage_2_26');

module.exports = {
  url: 'graph/settings/percona-platform',
  perconaPlatformPage_2_26,
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
    forceDisconnectModalText: '$force-disconnect-modal',
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
    cancelDisconnect: locate('button').withText('Cancel'),
  },
  messages: {
    technicalPreview: ' This feature is in Technical Preview stage',
    requiredField: 'Required field',
    invalidEmail: 'Invalid email address',
    connectedSuccess: 'Successfully connected PMM to Percona Platform',
    pmmDisconnectedFromProtal: 'Successfully disconnected PMM from Percona Platform',
    disconnectPMM: 'Disconnect PMM from Percona Platform',
    pmmConnected: 'This PMM instance is connected to Percona Platform.',
    forceDisconnectModalText: 'Are you sure you want to disconnect this PMM instance? This will unlink the instance from its current organization and stop all synchronization with Percona Platform. ',
    forceDisconnectSuccess: 'You have successfully disconnected this server from Percona Platform',
  },

  async openPerconaPlatform() {
    I.amOnPage(this.url);
    await this.waitForPerconaPlatformPageLoaded();
  },

  async waitForPerconaPlatformPageLoaded() {
    I.waitForVisible(this.elements.settingsContent, 30);
    I.waitInUrl(this.url);
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

  disconnectFromPortal(version) {
    I.click(this.fields.platformDisconnectButton);
    if (version >= 28 || version === undefined) {
      I.waitForText(this.messages.disconnectPMM);
      I.click(this.fields.confirmDisconnectButton);
    } else {
      I.verifyPopUpMessage(this.messages.pmmDisconnectedFromProtal);
    }
  },

  async forceDisconnectFromPortal() {
    await I.click(this.fields.platformDisconnectButton);
    await I.click(this.buttons.cancelDisconnect);
    await I.click(this.fields.platformDisconnectButton);
    await I.waitForVisible(this.elements.forceDisconnectModalText);
    const serviceName = await I.grabTextFrom(this.elements.forceDisconnectModalText);

    assert.ok(serviceName.includes(this.messages.forceDisconnectModalText), 'Force disconnect modal message is not correct.');
    await I.seeAttributesOnElements(locate('a').withText('Read More...'), {
      href: 'https://docs.percona.com/percona-monitoring-and-management/how-to/integrate-platform.html#disconnect-a-pmm-instance',
    });
    await I.click(this.buttons.confirmDisconnect);
    await I.verifyPopUpMessage(this.messages.forceDisconnectSuccess);
  },

  async isPMMConnected() {
    I.waitForVisible(this.elements.connectedWrapper, 20);
    I.waitForVisible(this.buttons.disconnect);
    locate('p').withText(this.messages.pmmConnected);
  },
};
