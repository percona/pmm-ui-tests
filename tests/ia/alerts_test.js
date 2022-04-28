const assert = require('assert');

const { ncPage } = inject();

let ruleIdForAlerts;
let ruleIdForEmailCheck;
let testEmail;
const ruleNameForEmailCheck = 'Rule with BUILT_IN template (check email)';
const ruleName = 'PSQL immortal rule';
const webhookURL = ncPage.types.webhook.url;
const rulesForAlerts = [{
  ruleName,
  severity: 'SEVERITY_CRITICAL',
}, {
  ruleName,
  severity: 'SEVERITY_ERROR',
}, {
  ruleName,
  severity: 'SEVERITY_NOTICE',
}, {
  ruleName,
  severity: 'SEVERITY_WARNING',
},
];
const alertName = 'PostgreSQL too many connections (pmm-server-postgresql)';

const rulesToDelete = [];
const rulesForSilensingAlerts = [];

Feature('IA: Alerts');

Before(async ({ I, settingsAPI }) => {
  await I.Authorize();
  await settingsAPI.apiEnableIA();
});

BeforeSuite(async ({
  I, settingsAPI, rulesAPI, alertsAPI, channelsAPI, ncPage,
}) => {
  await settingsAPI.apiEnableIA();
  await rulesAPI.clearAllRules(true);
  for (const rule of rulesForAlerts) {
    const ruleId = await rulesAPI.createAlertRule(rule);

    rulesToDelete.push(ruleId);
    rulesForSilensingAlerts.push({ ruleId, serviceName: 'pmm-server-postgresql' });
  }

  ruleIdForAlerts = await rulesAPI.createAlertRule({ ruleName });

  // Preparation steps for checking Alert via email
  const channelName = 'EmailChannel';

  testEmail = await I.generateNewEmail();

  await settingsAPI.setEmailAlertingSettings();
  const channelId = await channelsAPI.createNotificationChannel(
    channelName,
    ncPage.types.email.type,
    testEmail,
  );

  ruleIdForEmailCheck = await rulesAPI.createAlertRule({
    ruleName: ruleNameForEmailCheck,
    channels: [channelId],
  });

  // Wait for all alerts to appear
  await alertsAPI.waitForAlerts(60, rulesToDelete.length + 2);
});

AfterSuite(async ({
  settingsAPI, rulesAPI,
}) => {
  await settingsAPI.apiEnableIA();
  await rulesAPI.clearAllRules(true);
});

Scenario(
  'PMM-T564 Verify Severity colors @ia',
  async ({ I, alertsPage }) => {
    I.amOnPage(alertsPage.url);
    I.waitForElement(alertsPage.elements.criticalSeverity, 30);
    I.seeCssPropertiesOnElements(alertsPage.elements.criticalSeverity, { color: alertsPage.colors.critical });
    I.waitForElement(alertsPage.elements.highSeverity, 30);
    I.seeCssPropertiesOnElements(alertsPage.elements.highSeverity, { color: alertsPage.colors.high });
    I.waitForElement(alertsPage.elements.noticeSeverity, 30);
    I.seeCssPropertiesOnElements(alertsPage.elements.noticeSeverity, { color: alertsPage.colors.notice });
    I.waitForElement(alertsPage.elements.warningSeverity, 30);
    I.seeCssPropertiesOnElements(alertsPage.elements.warningSeverity, { color: alertsPage.colors.warning });
  },
);

Scenario(
  'PMM-T1146 Verify IA silence/unsilence all button @ia',
  async ({ I, alertmanagerAPI, alertsPage }) => {
    I.amOnPage(alertsPage.url);
    I.waitForVisible(alertsPage.buttons.silenceAllAlerts, 30);
    I.waitForVisible(alertsPage.buttons.unsilenceAllAlerts, 30);
    I.click(alertsPage.buttons.silenceAllAlerts);
    I.waitForElement(alertsPage.elements.criticalSeverity, 30);
    await alertmanagerAPI.verifyAlerts(rulesForSilensingAlerts, true);
    await alertsPage.checkAllAlertsColor('Silenced');

    I.click(alertsPage.buttons.unsilenceAllAlerts);
    I.waitForElement(alertsPage.elements.criticalSeverity, 30);
    await alertmanagerAPI.verifyAlerts(rulesForSilensingAlerts);
    await alertsPage.checkAllAlertsColor('Firing');
  },
);

Scenario(
  'PMM-T659 Verify alerts are deleted after deleting rules @ia',
  async ({ I, alertsPage, rulesAPI }) => {
    // Deleting rules
    for (const ruleId of rulesToDelete) {
      await rulesAPI.removeAlertRule(ruleId);
    }

    I.amOnPage(alertsPage.url);
    I.waitForElement(alertsPage.elements.alertRow(alertName), 30);

    I.seeNumberOfElements(alertsPage.elements.alertRow(alertName), 2);
    I.seeNumberOfElements(alertsPage.elements.criticalSeverity, 2);
  },
);

Scenario(
  'PMM-T569 Verify Alerts on Email @ia',
  async ({ I, rulesAPI }) => {
    // Get message from the inbox
    const message = await I.getLastMessage(testEmail, 120000);

    await I.seeTextInSubject('FIRING', message);

    assert.ok(message.html.body.includes(ruleNameForEmailCheck));

    await rulesAPI.removeAlertRule(ruleIdForEmailCheck);
  },
);

Scenario(
  'Verify Firing Alert, labels and existence in alertmanager @ia',
  async ({
    I, alertsPage, alertmanagerAPI,
  }) => {
    I.amOnPage(alertsPage.url);
    I.waitForElement(alertsPage.elements.alertRow(alertName), 30);

    // Verify correct labels
    I.see('Critical', alertsPage.elements.severityCell(alertName));

    // Verify Alert exists in alertmanager
    await alertmanagerAPI.verifyAlerts([{ ruleId: ruleIdForAlerts, serviceName: 'pmm-server-postgresql' }]);
  },
);

Scenario(
  'PMM-T1137 Verify that IA alerts are showing important labels first @ia',
  async ({ I, alertsPage }) => {
    I.amOnPage(alertsPage.url);
    I.waitForElement(alertsPage.elements.alertRow(alertName), 30);
    alertsPage.checkContainingLabels({
      primaryLabels: ['node_name=pmm-server', 'service_name=pmm-server-postgresql'],
      alertName,
    });
    I.click(alertsPage.buttons.arrowIcon(alertName));
    I.waitForVisible(alertsPage.elements.details, 30);
    I.seeElement(alertsPage.elements.detailsRuleExpression, 30);
    I.seeElement(alertsPage.elements.detailsSecondaryLabels, 30);
    alertsPage.checkContainingLabels({
      secondaryLabels: ['agent_type=postgres_exporter',
        'alertgroup=PMM Integrated Alerting',
        'node_id=pmm-server',
        'node_type=generic',
        'server=127.0.0.1:5432',
        'service_type=postgresql'],
    });
  },
);

Scenario(
  'PMM-T540 Alerts list columns @ia',
  async ({ I, alertsPage }) => {
    I.amOnPage(alertsPage.url);
    I.waitForElement(alertsPage.elements.alertRow(alertName), 30);
    alertsPage.columnHeaders.forEach((header) => {
      const columnHeader = alertsPage.elements.columnHeaderLocator(header);

      I.waitForVisible(columnHeader, 30);
    });

    // Verify there are no duplicate alerts
    I.seeNumberOfElements(alertsPage.elements.alertRow(alertName), 1);
  },
);

Scenario(
  'PMM-T541 Verify user is able to silence/activate the alert @ia',
  async ({
    I, alertsPage, alertmanagerAPI,
  }) => {
    I.amOnPage(alertsPage.url);
    I.waitForVisible(alertsPage.elements.alertRow(alertName), 30);
    await alertsPage.silenceAlert(alertName);
    await alertmanagerAPI.verifyAlerts([{ ruleId: ruleIdForAlerts, serviceName: 'pmm-server-postgresql' }], true);
    await alertsPage.activateAlert(alertName);
    await alertmanagerAPI.verifyAlerts([{ ruleId: ruleIdForAlerts, serviceName: 'pmm-server-postgresql' }]);
  },
);

Scenario(
  'PMM-T587 Verify user cant see Alert with non-existing filter @ia',
  async ({ I, alertsPage, rulesAPI }) => {
    const rule = {
      ruleId: ruleIdForAlerts,
      ruleName,
      filters: [
        {
          key: 'service_name',
          value: 'pmm-server-postgresql111',
          type: 'EQUAL',
        },
      ],
    };

    await rulesAPI.updateAlertRule(rule);

    I.amOnPage(alertsPage.url);
    I.waitForVisible(alertsPage.elements.noData);
    I.dontSeeElement(alertsPage.elements.alertRow(alertName));
  },
);

// nightly candidate
Scenario(
  'PMM-T625 Verify Alert disappears after issue in rule is fixed @ia',
  async ({
    I, alertsPage, rulesAPI, alertsAPI,
  }) => {
    const rule = {
      ruleId: ruleIdForAlerts,
      ruleName,
      params: [
        {
          name: 'threshold',
          type: 'FLOAT',
          float: 99,
        },
      ],
    };

    await rulesAPI.updateAlertRule(rule);
    await alertsAPI.waitForAlertsToDisappear(60);

    I.amOnPage(alertsPage.url);
    I.waitForVisible(alertsPage.elements.noData);
    I.seeTextEquals(alertsPage.messages.noAlertsFound, alertsPage.elements.noData);
    I.dontSeeElement(alertsPage.elements.alertRow(alertName));
  },
);

Scenario(
  'PMM-T568 Verify alerts on Pager Duty @ia',
  async ({ I, alertsPage, channelsAPI, rulesAPI, alertsAPI, alertmanagerAPI, alertRulesPage }) => {
    await rulesAPI.clearAllRules(true);
    const channelName = 'Pager Duty with Service key';
    const ruleName = 'Rule Name for Pager Duty with Service key';
    const channelId = await channelsAPI.createNotificationChannel(channelName, ncPage.types.pagerDuty.type);
    const rule = {
      ruleName,
      channels: [channelId],
    };
    const ruleId = await rulesAPI.createAlertRule(rule);

    alertRulesPage.openAlertRulesTab();
    I.waitForVisible(alertRulesPage.buttons.toggleAlertRule(ruleName), 30);
    alertRulesPage.verifyRuleState(true, ruleName);

    await alertsAPI.waitForAlerts(60, 1);
    I.amOnPage(alertsPage.url);
    I.waitForElement(alertsPage.elements.alertRow(alertName), 60);
    I.see('Critical', alertsPage.elements.severityCell(alertName));
    await alertmanagerAPI.verifyAlerts([{ ruleId, serviceName: 'pmm-server-postgresql' }]);

    // Verify pager notification received
    await rulesAPI.removeAlertRule(ruleId);
    await channelsAPI.deleteNotificationChannel(channelId);
  },
);

Scenario(
  'PMM-T1044 Verify user is able to add WebHook (using HTTPs request) notification channel @ia',
  async ({ I, rulesAPI, alertsAPI, alertRulesPage }) => {
    const channelName = 'Webhook Channel for 1044';
    const ruleName = 'AlertRuleFor1044';

    ncPage.openNotificationChannelsTab();
    // await ncPage.createChannel(channelName, ncPage.types.webhook.type);
    I.waitForVisible(ncPage.buttons.openAddChannelModal, 30);
    I.click(ncPage.buttons.openAddChannelModal);
    I.waitForVisible(ncPage.fields.typeDropdown, 30);
    await ncPage.selectChannelType(ncPage.types.webhook.type);
    I.fillField(ncPage.fields.nameInput, channelName);
    I.fillField(ncPage.fields.webhookUrlInput, webhookURL);
    I.click(ncPage.buttons.addChannel);
    I.verifyPopUpMessage(ncPage.messages.successfullyAdded);
    ncPage.verifyChannelInList(channelName, ncPage.types.webhook.type);
    const ruleId = await rulesAPI.createAlertRule({ ruleName });

    alertRulesPage.openAlertRulesTab();
    I.waitForVisible(alertRulesPage.buttons.toggleAlertRule(ruleName), 30);
    alertRulesPage.verifyRuleState(true, ruleName);
    await alertsAPI.waitForAlerts(60, 1);

    I.click(alertRulesPage.buttons.editRule);
    I.waitForVisible(alertRulesPage.elements.modalHeader, 30);
    alertRulesPage.searchAndSelectResult('Channels', channelName);
    I.click(alertRulesPage.buttons.addRule);
    I.verifyPopUpMessage(alertRulesPage.messages.successfullyEdited);
    await alertsAPI.waitForAlerts(60, 2);
    // Verify Webhook Notification is sent to the specified resource
  },
);

Scenario(
  'PMM-T1145 Verify that TLS option is using dropdown instead of a checkbox @ia',
  async ({ I }) => {
    const channelName = 'Webhook Channel for 1145';

    ncPage.openNotificationChannelsTab();
    I.waitForVisible(ncPage.buttons.openAddChannelModal, 30);
    I.click(ncPage.buttons.openAddChannelModal);
    I.waitForVisible(ncPage.fields.typeDropdown, 30);
    await ncPage.selectChannelType(ncPage.types.webhook.type);
    I.fillField(ncPage.fields.nameInput, channelName);
    I.fillField(ncPage.fields.webhookUrlInput, webhookURL);
    I.waitForText('Maximum number of alerts to include in message (0 = all)', 30, ncPage.elements.maxAlertsCountLabel);

    const defaultCount = await I.grabAttributeFrom(ncPage.fields.maxAlertsCount, 'value');

    assert.ok(defaultCount === '0', `Default value must be 0, not ${defaultCount}`);

    I.fillField(ncPage.fields.maxAlertsCount, 2);
    I.seeElement(ncPage.buttons.tslDropdown, 30);
    I.click(ncPage.buttons.tslDropdown);
    I.waitForVisible(ncPage.elements.caCertificateFieldLabel, 30);
    I.waitForText('CA Certificate', 30, ncPage.elements.caCertificateFieldLabel);
    I.scrollPageToBottom();
    I.seeElement(ncPage.fields.caCertificateInput, 30);
    I.waitForText('Certificate', 30, ncPage.elements.certificateFieldLabel);
    I.seeElement(ncPage.fields.certificateInput, 30);
    I.waitForText('Certificate Key', 30, ncPage.elements.certificateKeyFieldLabel, 30);
    I.seeElement(ncPage.fields.certificateKeyInput, 30);
    I.waitForText('Server Name', 30, ncPage.elements.serverNameFieldLabel, 30);
    I.seeElement(ncPage.fields.serverNameInput, 30);
    I.waitForText('Skip TLS certificate verification', 30, ncPage.elements.skipTlsVerifyFieldLabel, 30);
    I.click(ncPage.elements.skipTlsVerifyFieldLabel);

    I.click(ncPage.buttons.addChannel);
    I.verifyPopUpMessage(ncPage.messages.successfullyAdded);
    ncPage.verifyChannelInList(channelName, ncPage.types.webhook.type);
    // verify that alertsCount = 2
  },
);

Scenario(
  'PMM-T1045 Verify user is able to add secure WebHook (using basic Auth) notification channel @ia',
  async ({ I, rulesAPI, alertRulesPage, alertsAPI }) => {
    const channelName = 'Webhook notification channel';
    const ruleName = 'Rule for webhook';

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
    const rule = {
      ruleName,
      // channels: [channelId],
    };
    const ruleId = await rulesAPI.createAlertRule(rule);

    alertRulesPage.openAlertRulesTab();
    I.waitForVisible(alertRulesPage.buttons.toggleAlertRule(ruleName), 30);
    alertRulesPage.verifyRuleState(true, ruleName);
    await alertsAPI.waitForAlerts(60, 1);
  },
);
