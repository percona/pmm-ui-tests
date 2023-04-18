const { I } = inject();
const assert = require('assert');

module.exports = {
  url: 'graph/integrated-alerting/notification-channels',
  types: {
    email: {
      name: 'Email Channel',
      type: 'Email',
      addresses: 'some@email.com, other@email.com',
    },
    pagerDuty: {
      name: 'PagerDuty Channel',
      type: 'Pager Duty',
      key: 'routingKey',
    },
    slack: {
      name: 'Slack Channel',
      type: 'Slack',
      slackChannel: 'slackChannel',
    },
    webhook: {
      name: 'Webhook Channel',
      type: 'Webhook',
      url: 'https://webhookd:8080/alert',
    },
  },
  elements: {
    notificationChannelsTab: '//div/a[@aria-label="Tab Notification Channels"]',
    channelInTable: (name, type) => `//td[text()="${name}"]/following-sibling::td[text()="${type}"]`,
    templatesTableHeader: '$alert-rule-templates-table-thead',
    noData: locate('$table-no-data').find('h1'),
    nameFieldLabel: '$name-field-label',
    modalHeader: '$modal-header',
    modalContent: '$modal-content',
    channelFieldValidation: '$channel-field-error-message',
    serviceKeyFieldLabel: '$service-field-label',
    routingKeyFieldLabel: '$routing-field-label',
    maxAlertsCountLabel: '$maxAlerts-field-label',
    caCertificateFieldLabel: '$ca-field-label',
    certificateFieldLabel: '$cert-field-label',
    certificateKeyFieldLabel: '$key-field-label',
    serverNameFieldLabel: '$serverName-field-label',
    skipTlsVerifyFieldLabel: '$skipVerify-field-label',
  },
  buttons: {
    openAddChannelModal: '$notification-channel-add-modal-button',
    closeModal: '$modal-close-button',
    addChannel: '$notification-channel-add-button',
    cancelAdding: '$notification-channel-cancel-button',
    confirmDelete: '$confirm-delete-modal-button',
    // removeChannelLocator returns delete channel button locators for a given channel name
    deleteChannelLocator: (name) => `//td[text()="${name}"]/following-sibling::td//button[@data-testid="delete-notification-channel-button"]`,
    // editChannelLocator returns delete channel button locators for a given channel name
    editChannelLocator: (name) => `//td[text()="${name}"]/following-sibling::td//button[@data-testid="edit-notification-channel-button"]`,
    pagerDutyServiceKeyOption: locate('label').withText('Service key'),
    pagerDutyRoutingKeyOption: locate('label').withText('Routing key'),
    tslDropdown: locate('div[class*="collapse__header-label"]').withText('TLS Settings'),
  },
  fields: {
    nameInput: '$name-text-input',
    typeDropdown: 'div[class$="grafana-select-value-container"]',
    typeOptionLocator: (type) => `//div[@aria-label="Select option"]//span[text()="${type}"]`,
    emailsInput: '$emails-textarea-input',
    routingKeyInput: '$routing-text-input',
    serviceKeyInput: '$service-text-input',
    slackChannelInput: '$channel-text-input',
    webhookUrlInput: '$url-text-input',
    usernameInput: '$username-text-input',
    passwordInput: '$password-text-input',
    maxAlertsCount: '$maxAlerts-number-input',
    caCertificateInput: '$ca-textarea-input',
    certificateInput: '$cert-textarea-input',
    certificateKeyInput: '$key-textarea-input',
    serverNameInput: '$serverName-text-input',
  },
  messages: {
    noChannelsFound: 'No notification channels found',
    successfullyAdded: 'Notification channel was successfully added',
    successfullyEdited: 'Notification channel was successfully edited',
    deleteConfirmation: (name) => `Are you sure you want to delete the notification channel "${name}"?`,
    successfullyDeleted: (name) => `Notification channel "${name}" successfully deleted.`,
    channelUsedByRule: (name) => `You can't delete the "${name}" channel when it's being used by a rule.`,
    invalidCharacter: 'Channel shouldn\'t have # character.',
  },

  openNotificationChannelsTab() {
    I.amOnPage(this.url);
  },

  async selectChannelType(type) {
    I.waitForVisible(this.fields.typeDropdown, 30);
    await within(this.elements.modalContent, () => {
      I.click(this.fields.typeDropdown);
      I.waitForVisible(this.fields.typeOptionLocator(type), 30);
      I.click(this.fields.typeOptionLocator(type));
    });
    I.see(type, this.fields.typeDropdown);
  },

  async createChannel(name, type) {
    I.click(this.buttons.openAddChannelModal);
    I.waitForVisible(this.fields.typeDropdown, 30);
    I.seeElement(this.buttons.closeModal);
    I.seeElement(this.buttons.cancelAdding);
    await this.fillFields(name, type);
    I.click(this.buttons.addChannel);
    I.verifyPopUpMessage(this.messages.successfullyAdded);
  },

  async fillFields(name, type) {
    I.fillField(this.fields.nameInput, name);
    await this.selectChannelType(type);

    switch (type) {
      case this.types.email.type:
        I.fillField(this.fields.emailsInput, this.types.email.addresses);
        break;
      case this.types.pagerDuty.type:
        I.fillField(this.fields.routingKeyInput, this.types.pagerDuty.key);
        break;
      case this.types.slack.type:
        I.fillField(this.fields.slackChannelInput, this.types.slack.slackChannel);
        break;
      case this.types.webhook.type:
        I.fillField(this.fields.webhookUrlInput, this.types.webhook.url);
        break;
      default:
        assert.ok(false, `Did not find a matching notification channel type ${type}`);
    }
  },

  editChannel(name, type) {
    const suffix = '_EDITED';

    I.click(this.buttons.editChannelLocator(name, type));
    I.waitForVisible(this.buttons.addChannel, 30);
    I.seeElementsDisabled(this.buttons.addChannel);
    I.appendField(this.fields.nameInput, suffix);

    switch (type) {
      case this.types.email.type:
        I.appendField(this.fields.emailsInput, suffix);
        break;
      case this.types.pagerDuty.type:
        I.appendField(this.fields.routingKeyInput, suffix);
        break;
      case this.types.slack.type:
        I.appendField(this.fields.slackChannelInput, suffix);
        break;
      case this.types.webhook.type:
        I.appendField(this.fields.webhookUrlInput, suffix);
        break;
      default:
        assert.ok(false, `Did not find a matching notification channel type ${type}`);
    }

    I.click(this.buttons.addChannel);
    I.verifyPopUpMessage(this.messages.successfullyEdited);

    return `${name}${suffix}`;
  },

  deleteChannel(name, type) {
    I.waitForVisible(this.elements.channelInTable(name, type), 30);
    I.click(this.buttons.deleteChannelLocator(name));
    I.waitForText(this.messages.deleteConfirmation(name), 10, this.elements.modalContent);
    I.click(this.buttons.confirmDelete);
  },

  verifyChannelInList(channelName, type) {
    I.seeElement(this.elements.channelInTable(channelName, type));
    I.seeElement(this.buttons.editChannelLocator(channelName));
    I.seeElement(this.buttons.deleteChannelLocator(channelName));
  },

  skipTlsCertVerification() {
    I.seeElement(this.buttons.tslDropdown, 30);
    I.click(this.buttons.tslDropdown);
    I.waitForVisible(this.elements.caCertificateFieldLabel, 30);
    I.scrollPageToBottom();
    I.waitForVisible(this.elements.skipTlsVerifyFieldLabel, 30);
    I.click(this.elements.skipTlsVerifyFieldLabel);
  },
};
