const assert = require('assert');

let ruleIdForAlerts;
let ruleIdForNotificationsCheck;
let webhookChannelId;
let pagerDutyChannelId;
let testEmail;
const ruleNameForEmailCheck = 'Rule with BUILT_IN template (email, webhook)';
const ruleName = 'PSQL immortal rule';
const ruleFolder = 'PostgreSQL'
const rulesForAlerts = [{
    severity: 'SEVERITY_CRITICAL',
}, {
    severity: 'SEVERITY_ERROR',
}, {
    severity: 'SEVERITY_NOTICE',
}, {
    severity: 'SEVERITY_WARNING',
}, {
    severity: 'SEVERITY_ALERT',
}, {
    severity: 'SEVERITY_INFO',
}, {
    severity: 'SEVERITY_DEBUG',
}, {
    severity: 'SEVERITY_EMERGENCY',
},
];
const alertName = 'PostgreSQL too many connections (pmm-server-postgresql)';

const rulesToDelete = [];
const rulesForSilensingAlerts = [];

Feature('IA: Alerts');

Before(async ({ I }) => {
  await I.Authorize();
});

BeforeSuite(async ({
  I, settingsAPI, rulesAPI, alertsAPI, channelsAPI, ncPage,
}) => {
    await rulesAPI.removeAllAlertRules();
    
    for (const rule of rulesForAlerts) {
        await rulesAPI.createAlertRule({ ruleName: rule.severity, severity: rule.severity }, ruleFolder);
    }

//   for (const rule of rulesForAlerts) {
//     const ruleId = await rulesAPI.createAlertRule(rule);

//     rulesToDelete.push(ruleId);
//     rulesForSilensingAlerts.push({ ruleId, serviceName: 'pmm-server-postgresql' });
//   }

//   ruleIdForAlerts = await rulesAPI.createAlertRule({ ruleName });

//   // Preparation steps for checking Alert via email
//   const channelName = 'EmailChannel';

//   testEmail = await I.generateNewEmail();

//   await settingsAPI.setEmailAlertingSettings();
//   const channelId = await channelsAPI.createNotificationChannel(
//     channelName,
//     ncPage.types.email.type,
//     testEmail,
//   );

//   // Preparation steps for checking Alert via webhook server
//   // eslint-disable-next-line no-template-curly-in-string
//   await I.verifyCommand('bash -x ${PWD}/testdata/ia/gencerts.sh');
//   await I.verifyCommand('docker-compose -f docker-compose-webhook.yml up -d');
//   const cert = await I.readFileSync('./testdata/ia/certs/self.crt');

//   webhookChannelId = await channelsAPI.createNotificationChannel(
//     'Webhook channel',
//     ncPage.types.webhook.type,
//     {
//       url: ncPage.types.webhook.url,
//       ca_file_content: cert,
//       insecure_skip_verify: true,
//       username: 'alert',
//       password: 'alert',
//     },
//   );

//   pagerDutyChannelId = await channelsAPI.createNotificationChannel(
//     'PD channel',
//     ncPage.types.pagerDuty.type,
//     {
//       service_key: process.env.PAGER_DUTY_SERVICE_KEY,
//     },
//   );

//   ruleIdForNotificationsCheck = await rulesAPI.createAlertRule({
//     ruleName: ruleNameForEmailCheck,
//     channels: [channelId, webhookChannelId, pagerDutyChannelId],
//   });

//   // Wait for all alerts to appear
//   await alertsAPI.waitForAlerts(60, rulesToDelete.length + 2);
});

// AfterSuite(async ({
//   settingsAPI, rulesAPI, I,
// }) => {
//   await settingsAPI.apiEnableIA();
//   await rulesAPI.clearAllRules(true);
//   // TO-DO to ensure this runs as expected.
//   // await I.verifyCommand('docker-compose -f docker-compose-webhook.yml stop');
// });

Scenario(
  'PMM-T564 Verify fired alert severity colors @ia',
  async ({ I, alertsPage, rulesAPI }) => {
    //TODO
    I.wait(120);
    I.amOnPage(alertsPage.url);
    I.waitForElement(alertsPage.elements.criticalSeverity, 30);
    I.seeCssPropertiesOnElements(alertsPage.elements.criticalSeverity, { color: alertsPage.colors.critical });
    I.seeCssPropertiesOnElements(alertsPage.elements.errorSeverity, { color: alertsPage.colors.error });
    I.seeCssPropertiesOnElements(alertsPage.elements.noticeSeverity, { color: alertsPage.colors.notice });
    I.seeCssPropertiesOnElements(alertsPage.elements.warningSeverity, { color: alertsPage.colors.warning });
    I.seeCssPropertiesOnElements(alertsPage.elements.emergencySeverity, { color: alertsPage.colors.critical });
    I.seeCssPropertiesOnElements(alertsPage.elements.debugSeverity, { color: alertsPage.colors.notice });
    I.seeCssPropertiesOnElements(alertsPage.elements.infoSeverity, { color: alertsPage.colors.notice });
    I.seeCssPropertiesOnElements(alertsPage.elements.alertSeverity, { color: alertsPage.colors.critical });
  },
);

// Skip until https://jira.percona.com/browse/PMM-11130
Scenario.skip(
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

Scenario.skip(
  'PMM-T551 PMM-T569 PMM-T1044 PMM-T1045 PMM-T568 Verify Alerts on Email, Webhook and Pager Duty @ia @fb',
  async ({ I, rulesAPI, alertsAPI }) => {
    const file = './testdata/ia/scripts/alert.txt';

    // Get message from the inbox
    const message = await I.getLastMessage(testEmail, 120000);

    await I.seeTextInSubject('FIRING', message);
    assert.ok(message.html.body.includes(ruleNameForEmailCheck));

    // Webhook notification check
    I.waitForFile(file, 100);
    I.seeFile(file);
    I.seeInThisFile(ruleNameForEmailCheck);
    I.seeInThisFile(ruleIdForNotificationsCheck);
    I.seeInThisFile(webhookChannelId);

    // Pager Duty notification check
    await alertsAPI.verifyAlertInPagerDuty(ruleIdForNotificationsCheck);

    await rulesAPI.removeAlertRule(ruleIdForNotificationsCheck);
  },
);

Scenario.skip(
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

Scenario.skip(
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

Scenario.skip(
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

Scenario.skip(
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
Scenario.skip(
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
