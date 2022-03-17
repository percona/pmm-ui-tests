const assert = require('assert');

let ruleIdForAlerts;
let ruleIdForEmailCheck;
let testEmail;
const ruleNameForEmailCheck = 'Rule with BUILT_IN template (check email)';
const ruleName = 'PSQL immortal rule';
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
    alertsPage.checkContainingLabels(alertName,
      ['node_name=pmm-server', 'service_name=pmm-server-postgresql']);
    I.click(alertsPage.buttons.arrowIcon(alertName));
    I.waitForVisible(alertsPage.elements.details, 30);
    I.seeElement(alertsPage.elements.detailsRuleExpression, 30);
    I.seeElement(alertsPage.elements.detailsSecondaryLabels, 30);
    alertsPage.checkContainingSecondaryLabels(['agent_type=postgres_exporter',
      'alertgroup=PMM Integrated Alerting',
      'node_id=pmm-server',
      'node_type=generic',
      'server=127.0.0.1:5432',
      'service_type=postgresql']);
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
