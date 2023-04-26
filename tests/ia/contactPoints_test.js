const page = require('./pages/notificationChannelsPage');
const { settingsAPI, contactPointsPage } = inject();

const slackCPName = 'Slack contact point'
const notificationChannels = new DataTable(['name', 'type']);

// for (const [, channel] of Object.entries(page.types)) {
//   notificationChannels.add([channel.name, channel.type]);
// }

Feature('IA: Notification Channels').retry(1);

Before(async ({
  I, channelsAPI, settingsAPI, rulesAPI,
}) => {
  await I.Authorize();
  //   await settingsAPI.apiEnableIA();
  //   await rulesAPI.clearAllRules();
  //   await channelsAPI.clearAllNotificationChannels();
});

After(async ({ channelsAPI, rulesAPI }) => {
  //   await rulesAPI.clearAllRules();
  //   await channelsAPI.clearAllNotificationChannels();
});

Scenario(
  'PMM-T1703 Verify Slack contact point can be created @ia',
  async ({ I }) => {
    await contactPointsPage.openContactPointsTab();
    // TODO url
    await contactPointsPage.createSlackCP(slackCPName);
    I.verifyPopUpMessage(contactPointsPage.messages.cPCreatedSuccess);
    I.waitForVisible(contactPointsPage.elements.cPTable, 10);
    I.see(slackCPName, contactPointsPage.elements.cPTable);
  },
);

Scenario(
  'PMM-T1704 Verify Slack contact point can be deleted @ia',
  async ({ I }) => {
    await contactPointsPage.openContactPointsTab();
    I.waitForVisible(contactPointsPage.buttons.deleteCP(2), 10);
    I.click(contactPointsPage.buttons.deleteCP(2));
    I.waitForVisible(contactPointsPage.elements.deleteCPDialogHeader, 10);
    I.see(contactPointsPage.messages.deleteCPConfirm(slackCPName));
    I.click(contactPointsPage.buttons.confirmDeleteCP);
    I.verifyPopUpMessage(contactPointsPage.messages.cPDeletedSuccess);
    I.dontSee(slackCPName, contactPointsPage.elements.cPTable);
  },
);

Scenario(
  'PMM-T645, PMM-T647 Add a Pager Duty with Service Key @ia @grafana-pr @fb',
  async ({ I, ncPage }) => {
    const channelName = 'Pager Duty with Service key';

    ncPage.openNotificationChannelsTab();
    I.click(ncPage.buttons.openAddChannelModal);
    I.waitForVisible(ncPage.fields.typeDropdown, 30);
    I.fillField(ncPage.fields.nameInput, channelName);
    await ncPage.selectChannelType(ncPage.types.pagerDuty.type);
    I.click(ncPage.buttons.pagerDutyServiceKeyOption);
    I.waitForVisible(ncPage.fields.serviceKeyInput, 10);
    I.fillField(ncPage.fields.serviceKeyInput, 'ServiceKeyValue');
    I.click(ncPage.buttons.addChannel);
    I.verifyPopUpMessage(ncPage.messages.successfullyAdded);
    ncPage.verifyChannelInList(channelName, ncPage.types.pagerDuty.type);
  },
);

// Scenario(
//   'PMM-T647 Verify toggle for Service/Routing key @ia @grafana-pr',
//   async ({ I, ncPage }) => {
//     ncPage.openNotificationChannelsTab();
//     I.click(ncPage.buttons.openAddChannelModal);
//     I.waitForVisible(ncPage.fields.typeDropdown, 30);
//     await ncPage.selectChannelType(ncPage.types.pagerDuty.type);
//     I.dontSeeElement(ncPage.elements.serviceKeyFieldLabel);
//     I.seeElement(ncPage.elements.routingKeyFieldLabel);
//     I.fillField(ncPage.fields.routingKeyInput, 'RoutingKeyValue');
//     I.click(ncPage.buttons.pagerDutyServiceKeyOption);
//     I.waitForVisible(ncPage.fields.serviceKeyInput, 10);
//     I.seeElement(ncPage.elements.serviceKeyFieldLabel);
//     I.fillField(ncPage.fields.serviceKeyInput, 'ServiceKeyValue');
//     I.click(ncPage.buttons.pagerDutyRoutingKeyOption);
//     I.seeElement(ncPage.elements.routingKeyFieldLabel);
//     I.seeInField(ncPage.fields.routingKeyInput, 'RoutingKeyValue');
//     I.click(ncPage.buttons.pagerDutyServiceKeyOption);
//     I.seeInField(ncPage.fields.serviceKeyInput, 'ServiceKeyValue');
//   },
// );

Data(notificationChannels).Scenario(
  'PMM-T492 Edit notification channel @ia',
  async ({
    I, ncPage, channelsAPI, current,
  }) => {
    await channelsAPI.createNotificationChannel(current.name, current.type);
    ncPage.openNotificationChannelsTab();
    const newName = ncPage.editChannel(current.name, current.type);

    I.seeElement(ncPage.elements.channelInTable(newName, current.type));
    I.seeElement(ncPage.buttons.editChannelLocator(newName));
    I.seeElement(ncPage.buttons.deleteChannelLocator(newName));
    I.click(ncPage.buttons.editChannelLocator(newName));
    I.seeInField(ncPage.fields.nameInput, newName);
  },
);

Data(notificationChannels).Scenario(
  'PMM-T493 Delete a notification channel @ia @grafana-pr',
  async ({
    I, ncPage, channelsAPI, current,
  }) => {
    await channelsAPI.createNotificationChannel(current.name, current.type);
    ncPage.openNotificationChannelsTab();
    I.click(ncPage.buttons.deleteChannelLocator(current.name));
    I.see(ncPage.messages.deleteConfirmation(current.name), ncPage.elements.modalContent);
    I.click(ncPage.buttons.confirmDelete);
    I.verifyPopUpMessage(ncPage.messages.successfullyDeleted(current.name));
    I.dontSeeElement(ncPage.elements.channelInTable(current.name, current.type));
  },
);

Scenario(
  ' Delete a notification channel @fb',
  async ({ I, ncPage, channelsAPI }) => {
    const name = 'Email Channel';
    const type = 'Email';

    await channelsAPI.createNotificationChannel(name, type);
    ncPage.openNotificationChannelsTab();
    I.click(ncPage.buttons.deleteChannelLocator(name));
    I.see(ncPage.messages.deleteConfirmation(name), ncPage.elements.modalContent);
    I.click(ncPage.buttons.confirmDelete);
    I.verifyPopUpMessage(ncPage.messages.successfullyDeleted(name));
    I.dontSeeElement(ncPage.elements.channelInTable(name, type));
  },
);

Data(notificationChannels).Scenario(
  'PMM-T658 Verify notification channel can not be deleted if it is used by a rule @ia',
  async ({
    I, ncPage, channelsAPI, rulesAPI, current,
  }) => {
    const channel = {
      name: current.name,
      type: current.type,
    };
    const channelId = await channelsAPI.createNotificationChannel(channel.name, channel.type);
    const ruleId = await rulesAPI.createAlertRule({ channels: [channelId] });

    ncPage.openNotificationChannelsTab();
    ncPage.deleteChannel(channel.name, channel.type);

    I.verifyPopUpMessage(ncPage.messages.channelUsedByRule(channel.name));

    await rulesAPI.removeAlertRule(ruleId);
    await channelsAPI.deleteNotificationChannel(channelId);
  },
);

Scenario(
  'PMM-T1045 Verify user is able to add WebHook notification channel @ia',
  async ({
    I, rulesAPI, ncPage,
  }) => {
    const channelName = 'Webhook notification channel';
    const webhookURL = ncPage.types.webhook.url;

    await rulesAPI.clearAllRules(true);
    ncPage.openNotificationChannelsTab();
    I.waitForVisible(ncPage.buttons.openAddChannelModal, 30);
    I.click(ncPage.buttons.openAddChannelModal);
    I.waitForVisible(ncPage.fields.typeDropdown, 30);
    await ncPage.selectChannelType(ncPage.types.webhook.type);
    I.fillField(ncPage.fields.nameInput, channelName);
    I.fillField(ncPage.fields.webhookUrlInput, webhookURL);
    ncPage.skipTlsCertVerification();
    I.click(ncPage.buttons.addChannel);
    I.verifyPopUpMessage(ncPage.messages.successfullyAdded);
    ncPage.verifyChannelInList(channelName, ncPage.types.webhook.type);
  },
);
