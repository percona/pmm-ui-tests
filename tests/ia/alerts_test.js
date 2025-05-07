const assert = require('assert');
const contactPointsAPI = require('./pages/api/contactPointsAPI');

const ruleName = 'PSQL immortal rule';
const ruleFolder = 'PostgreSQL';
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

Feature('Alerting: Alerts');

Before(async ({ I }) => {
  await I.Authorize();
});

BeforeSuite(async ({ I, rulesAPI }) => {
  await rulesAPI.removeAllAlertRules();
  await contactPointsAPI.createContactPoints();
  await rulesAPI.createAlertRule({ ruleName }, ruleFolder);

  // Preparation steps for checking Alert via webhook server
  await I.verifyCommand('docker-compose -f docker-compose-webhook.yml up -d');
});

AfterSuite(async ({ rulesAPI, I }) => {
  await rulesAPI.removeAllAlertRules();
  await I.verifyCommand('docker-compose -f docker-compose-webhook.yml stop');
});

Scenario(
  'PMM-T1482 Verify fired alert @ia',
  async ({ I, alertsPage, alertsAPI }) => {
    await alertsAPI.waitForAlerts(24, 1);
    await I.amOnPage(alertsPage.url);
    alertsPage.columnHeaders.forEach((header) => {
      const columnHeader = alertsPage.elements.columnHeaderLocator(header);

      I.waitForVisible(columnHeader, 10);
    });

    // Verify there are no duplicate alerts
    await I.seeNumberOfElements(alertsPage.elements.alertRow(ruleName), 1);
    // Wait for the firing alert to arrive in webhook and PD
    await I.wait(60);
  },
);

Scenario(
  'PMM-T1494 PMM-T1495 Verify fired alert in Pager Duty and Webhook @ia',
  async ({ I, alertsAPI, rulesAPI }) => {
    const file = './testdata/ia/scripts/alert.txt';
    const alertUID = await rulesAPI.getAlertUID(ruleName, ruleFolder);

    // Webhook notification check
    I.waitForFile(file, 100);
    I.seeFile(file);
    I.seeInThisFile(ruleName);

    // Pager Duty notification check
    await alertsAPI.verifyAlertInPagerDuty(alertUID);
  },
);

Scenario(
  'PMM-T1496 PMM-T1497 Verify it is possible to silence and unsilence alert @ia',
  async ({
    I, alertsPage, alertmanagerAPI,
  }) => {
    I.amOnPage(alertsPage.url);
    await alertsPage.verifyAlert(ruleName);
    await alertsPage.silenceAlert(ruleName);
    I.amOnPage(alertsPage.url);
    await alertsPage.verifyAlert(ruleName, true);
    const silences = await alertmanagerAPI.getSilenced();

    await alertmanagerAPI.deleteSilences(silences);
    I.amOnPage(alertsPage.url);
    await alertsPage.verifyAlert(ruleName, false);
  },
);

Scenario(
  'PMM-T1498 Verify firing alerts dissappear when the condition is fixed @ia',
  async ({
    I, alertsPage, alertRulesPage,
  }) => {
    I.amOnPage(alertsPage.url);
    I.waitForElement(alertsPage.elements.firedAlertLink(ruleName));
    I.click(alertsPage.elements.firedAlertLink(ruleName));
    I.click(alertRulesPage.buttons.editRuleOnView);
    I.fillField(alertRulesPage.fields.editRuleThreshold, '20m');
    I.click(alertRulesPage.buttons.saveAndExit);
    I.amOnPage(alertsPage.url);
    I.wait(100);
    I.seeElement(alertsPage.elements.noAlerts);
    I.dontSeeElement(alertsPage.elements.alertRow(ruleName));
  },
);

// FIXME: Skip until https://jira.percona.com/browse/PMM-11130 is fixed
Scenario.skip(
  'PMM-T659 Verify alerts are deleted after deleting rules @ia',
  async ({ I, alertsPage, rulesAPI }) => {
    // Deleting rules
    await rulesAPI.removeAllAlertRules();

    I.amOnPage(alertsPage.url);
    I.seeElement(alertsPage.elements.noAlerts);
  },
);

Scenario(
  'PMM-T1499 Verify an alert with non-existing filter (label) does not show up in list @ia',
  async ({ I, alertsPage, rulesAPI }) => {
    await rulesAPI.removeAllAlertRules();
    const wrongFilterRule = {
      ruleName: 'wrongFilterRule',
      filters: [
        {
          label: 'service_name',
          regexp: 'wrong-service',
          type: 'MATCH',
        },
      ],
    };

    await rulesAPI.createAlertRule(wrongFilterRule, 'Insight');
    I.amOnPage(alertsPage.url);
    I.wait(100);
    I.seeElement(alertsPage.elements.noAlerts);
  },
);

Scenario(
  'PMM-T564 Verify fired alert severity colors @ia',
  async ({
    I, alertsPage, rulesAPI, alertsAPI,
  }) => {
    await rulesAPI.removeAllAlertRules();
    for (const rule of rulesForAlerts) {
      await rulesAPI.createAlertRule({ ruleName: rule.severity, severity: rule.severity }, ruleFolder);
    }

    await alertsAPI.waitForAlerts(24, 8);
    await I.wait(10);
    await I.amOnPage(alertsPage.url);
    rulesForAlerts.forEach((item) => I.waitForElement(alertsPage.elements.alertRow(item.severity), 10));
    rulesForAlerts.forEach((item) => I.see('Active', alertsPage.elements.stateCell(item.severity)));
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

Scenario(
  'PMM-T1467 Verify empty Fired alerts list @ia',
  async ({ I, alertsPage, rulesAPI }) => {
    await rulesAPI.removeAllAlertRules();
    I.amOnPage(alertsPage.url);
    I.waitForVisible(alertsPage.elements.noAlerts, 10);
    I.seeElement(alertsPage.elements.noAlerts);
  },
);

Scenario(
    'PMM-12442 Let users see full summary message on Fired alerts tab @ia @alerting-fb',
    async ({
               I, alertsPage, alertRulesPage,
           }) => {
        I.amOnPage(alertsPage.url);
        I.waitForElement(alertsPage.elements.firedAlertLink(ruleName), 180);
        I.click(alertsPage.elements.firedAlertLink(ruleName));
        I.click(alertRulesPage.buttons.editRuleOnView);
        let summaryText = String("PostgreSQL very long text for Summary, PMM-12442 Let users see full summary message on Fired alerts tab");
        I.fillField(alertRulesPage.fields.editSummary, summaryText);
        I.click(alertRulesPage.buttons.saveAndExit);
        I.amOnPage(alertsPage.url);
        I.waitForText(summaryText,180);
        I.see(summaryText, alertRulesPage.fields.tableBody);
    },
);
