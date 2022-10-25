const assert = require('assert');
const page = require('./pages/alertRulesPage');

const rules = new DataTable(['template', 'templateType', 'ruleName', 'threshold', 'thresholdUnit', 'duration',
  'severity', 'filters', 'channels', 'activate']);

Object.values(page.rules).forEach((rule) => {
  rules.add([rule.template, rule.templateType, rule.ruleName, rule.threshold,
    rule.thresholdUnit, rule.duration, rule.severity, rule.filters, rule.channels, rule.activate]);
});

const templates = new DataTable(['template', 'threshold', 'duration', 'severity', 'expression', 'alert']);

Object.values(page.templates).forEach((template) => {
  templates.add([template.template, template.threshold, template.duration, template.severity,
    template.expression, template.alert]);
});

Feature('IA: Alert rules').retry(1);

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1384 Verify empty alert rules list @ia @grafana-pr',
  async ({ I, alertRulesPage }) => {
    alertRulesPage.openAlertRulesTab();
    I.waitForText(alertRulesPage.messages.noRulesFound, alertRulesPage.elements.noRules);
    const link = await I.grabAttributeFrom(alertRulesPage.elements.alertsLearnMoreLinks, 'href');

    assert.ok(link === 'https://grafana.com/docs/', `Redirect link ${link} is incorrect please check`);
  },
);

Scenario(
  'PMM-T1385 Verify alert rules elements @ia @grafana-pr',
  async ({ I, alertRulesPage, rulesAPI }) => {
    const ruleName = 'testRule';
    const ruleFolder = 'PostgreSQL'
    await rulesAPI.createAlertRule({ ruleName }, ruleFolder);

    alertRulesPage.openAlertRulesTab();
    I.seeElement(alertRulesPage.elements.searchByDataSourceDropdown);
    I.seeElement(alertRulesPage.elements.searchByLabel);
    alertRulesPage.alertRuleFilters.forEach((filter) => {
        const ruleFilter = alertRulesPage.elements.ruleFilterLocator(filter);
  
        I.waitForVisible(ruleFilter, 10);
    });
    I.click(alertRulesPage.buttons.groupCollapseButton(ruleFolder));
    alertRulesPage.columnHeaders.forEach((header) => {
      const columnHeader = alertRulesPage.elements.columnHeaderLocator(header);

      I.waitForVisible(columnHeader, 30);
    });
    const folderUID = await rulesAPI.getFolderUID(ruleFolder);

    I.seeElement(alertRulesPage.buttons.editFolderButton(folderUID, ruleFolder.toLowerCase()));
    I.seeElement(alertRulesPage.buttons.managePermissionsButton(folderUID, ruleFolder.toLowerCase()));
    I.seeElement(alertRulesPage.elements.totalRulesCounter('1 rule', ruleFolder));
    await rulesAPI.removeAlertRule(ruleFolder);
  },
);

Scenario(
  'PMM-T1392 Verify fields dynamically change value when template is changed @ia @grafana-pr',
  async ({ I, alertRulesPage }) => {
    //TODO: https://jira.percona.com/browse/PMM-10860 name doesn't change
    alertRulesPage.openAlertRulesTab();
    I.click(alertRulesPage.buttons.openAddRuleModal);
    //percona templated alert by default
    alertRulesPage.searchAndSelectResult('template', 'MongoDB down');
    I.waitForValue(alertRulesPage.fields.inputField('duration'), '5s');
    I.seeTextEquals('Critical', alertRulesPage.fields.dropdownValue('severity'));;
    alertRulesPage.searchAndSelectResult('template', 'MySQL restarted');
    I.waitForValue(alertRulesPage.fields.inputField('threshold'), 300);
    I.waitForValue(alertRulesPage.fields.inputField('duration'), '60s');
    I.seeTextEquals('Warning', alertRulesPage.fields.dropdownValue('severity'));
  },
);

Scenario(
  'PMM-T1420 Verify user can create Percona templated alert @ia @fb',
  async ({ I, alertRulesPage, rulesAPI }) => {
    const rule =  page.rules[15];
    const newRule = page.rules[0];

    alertRulesPage.openAlertRulesTab();
    I.click(alertRulesPage.buttons.openAddRuleModal);
    await alertRulesPage.fillPerconaAlert(rule, newRule);
    I.click(alertRulesPage.buttons.addRule);
    I.verifyPopUpMessage(alertRulesPage.messages.successRuleCreate(newRule.ruleName));
    alertRulesPage.verifyRuleList(newRule.folder, newRule.ruleName);
    I.seeTextEquals('Normal', alertRulesPage.elements.ruleState);
    await rulesAPI.removeAlertRule(newRule.folder);
  },
);

// TODO: check ovf failure
Scenario(
  'PMM-T1430 Verify user can edit Percona templated alert @ia @not-ovf @fb',
  async ({
    I, alertRulesPage, rulesAPI,
  }) => {
    const ruleName = 'testRule';
    const ruleFolder = 'PostgreSQL'
    const editedRule = {
      ruleName: 'EDITED rule',
      duration: '2m',
      severity: 'Alert',
      folder: 'Experimental'
    };
    
    await rulesAPI.createAlertRule({ ruleName }, ruleFolder);
    alertRulesPage.openAlertRulesTab();
    alertRulesPage.verifyRuleList(ruleFolder, ruleName);
    I.waitForElement(alertRulesPage.buttons.ruleCollapseButton);
    I.click(alertRulesPage.buttons.ruleCollapseButton);
    I.click(alertRulesPage.buttons.editAlertRule);
    await alertRulesPage.editPerconaAlert(editedRule);
    await alertRulesPage.verifyRuleDetails(editedRule);
    await rulesAPI.removeAlertRule(editedRule.folder);
  },
);

Scenario(
  'PMM-T1433 Verify user can delete Percona templated alert @ia @fb',
  async ({
    I, alertRulesPage, rulesAPI,
  }) => {
    const ruleName = 'testRule';
    const ruleFolder = 'OS'

    await rulesAPI.createAlertRule({ ruleName }, ruleFolder);
    alertRulesPage.openAlertRulesTab();
    alertRulesPage.verifyRuleList(ruleFolder, ruleName);
    I.waitForElement(alertRulesPage.buttons.ruleCollapseButton);
    I.click(alertRulesPage.buttons.ruleCollapseButton);
    I.click(alertRulesPage.buttons.deleteAlertRule);
    I.waitForVisible(alertRulesPage.elements.deleteRuleConfirmation);
    I.click(alertRulesPage.buttons.cancelModal);
    I.click(alertRulesPage.buttons.deleteAlertRule);
    I.click(alertRulesPage.buttons.confirmModal);
    I.verifyPopUpMessage(alertRulesPage.messages.successfullyDeleted);
    I.dontSeeElement(alertRulesPage.buttons.groupCollapseButton(ruleFolder));
    I.waitForText(alertRulesPage.messages.noRulesFound, alertRulesPage.elements.noRules);
    await rulesAPI.removeAlertRule(ruleFolder);
  },
);

// nightly candidate
Scenario(
  'PMM-T1434 Verify validation errors when creating new alert rule @ia @grafana-pr',
  async ({
    I, alertRulesPage,
  }) => {
    const rule =  page.rules[2];
    const wrongRule = {
      threshold: '-1',
      duration: '0',
    }

    alertRulesPage.openAlertRulesTab();
    I.click(alertRulesPage.buttons.openAddRuleModal);
    await alertRulesPage.fillPerconaAlert(rule, wrongRule);
    I.clearField(alertRulesPage.fields.inputField('name'));
    I.click(alertRulesPage.buttons.addRule);
    I.verifyPopUpMessage(alertRulesPage.messages.failRuleCreate);
    I.seeElement(alertRulesPage.elements.ruleValidationError('Must enter an alert name'));
    I.seeElement(alertRulesPage.elements.ruleValidationError('Must be at least 0'));
    I.fillField(alertRulesPage.fields.inputField('name'), 'rule');
    I.dontSeeElement(alertRulesPage.elements.ruleValidationError('Must enter an alert name'));
    I.fillField(alertRulesPage.fields.inputField('threshold'), '0');
    I.dontSeeElement(alertRulesPage.elements.ruleValidationError('Must be at least 0'));
    I.click(alertRulesPage.buttons.addRule);
    I.verifyPopUpMessage(alertRulesPage.messages.failRuleCreateDuration);
    I.fillField(alertRulesPage.fields.inputField('duration'), 's');
    I.seeElement(alertRulesPage.elements.ruleValidationError('Must be of format "(number)(unit)", for example "1m", or just "0". Available units: s, m, h, d, w'));
  },
);
