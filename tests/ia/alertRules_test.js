const assert = require('assert');
const page = require('./pages/alertRulesPage');

const rules = new DataTable(['template', 'templateType', 'ruleName', 'threshold', 'thresholdUnit', 'duration',
  'severity', 'filters', 'channels', 'activate']);

Object.values(page.rules).forEach((rule) => {
  rules.add([rule.template, rule.templateType, rule.ruleName, rule.threshold,
    rule.thresholdUnit, rule.duration, rule.severity, rule.filters, rule.channels, rule.activate]);
});

const rulesStates = new DataTable(['disabled']);

rulesStates.add([true]);
rulesStates.add([false]);

const templates = new DataTable(['template', 'threshold', 'duration', 'severity', 'expression', 'alert']);

Object.values(page.templates).forEach((template) => {
  templates.add([template.template, template.threshold, template.duration, template.severity,
    template.expression, template.alert]);
});

Feature('IA: Alert rules').retry(1);

Before(async ({ I, settingsAPI, rulesAPI }) => {
  await I.Authorize();
  await settingsAPI.apiEnableIA();
  await rulesAPI.clearAllRules();
});

BeforeSuite(async ({
  I, settingsAPI, rulesAPI, templatesAPI, channelsAPI, ncPage,
}) => {
//   await settingsAPI.apiEnableIA();
//   await rulesAPI.clearAllRules();
//   await templatesAPI.clearAllTemplates();
//   await channelsAPI.clearAllNotificationChannels();
//   await templatesAPI.createRuleTemplate('tests/ia/templates/templateForRules.yaml');
//   await templatesAPI.createRuleTemplate('tests/ia/templates/range-empty.yaml');
//   await channelsAPI.createNotificationChannel('EmailChannelForRules', ncPage.types.email.type);
});

AfterSuite(async ({
  settingsAPI, rulesAPI, templatesAPI, channelsAPI,
}) => {
//   await settingsAPI.apiEnableIA();
//   await rulesAPI.clearAllRules();
//   await templatesAPI.clearAllTemplates();
//   await channelsAPI.clearAllNotificationChannels();
});

Scenario(
  'PMM-T1384 Verify empty alert rules list @ia @grafana-pr',
  async ({ I, alertRulesPage }) => {
    alertRulesPage.openAlertRulesTab();
    I.waitForText('You haven`t created any alert rules yet', alertRulesPage.elements.noRules);
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
    I.seeElement(alertRulesPage.elements.totalRulesCounter('3', ruleFolder)); //todo

    //folder header
    //counter

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
  'PMM-T1420 Verify user can create Percona templated alert @fb',
  async ({ I, alertRulesPage }) => {
    const rule = alertRulesPage.rules[0];

    alertRulesPage.openAlertRulesTab();
    I.click(alertRulesPage.buttons.openAddRuleModal);
    await alertRulesPage.fillPerconaAlert('Node high CPU load');
    I.click(alertRulesPage.buttons.addRule);
    I.verifyPopUpMessage(alertRulesPage.messages.successRuleCreated('Node high CPU load'));
    // I.seeElement(alertRulesPage.elements.rulesNameCell(rule.ruleName));
    // if (rule.threshold.length === 0) { rule.threshold = 80; }

    // alertRulesPage.verifyRowValues(rule);
  },
);

// TODO: check ovf failure
Scenario(
  'PMM-T516 PMM-T687 Update Alert rule @ia @grafana-pr @not-ovf @fb',
  async ({
    I, alertRulesPage, rulesAPI, channelsAPI, ncPage,
  }) => {
    const rule = {
      ruleName: 'QAA PSQL Update test',
      template: 'PostgreSQL connections in use',
      threshold: '1',
      thresholdUnit: '%',
      duration: '1',
      severity: 'Critical',
      filters: [{ label: 'service_name', operator: alertRulesPage.filterOperators.equal, value: 'pmm-server-postgresql' }],
      channels: '',
      activate: true,
      expression: 'sum(pg_stat_activity_count{datname!~"template.*|postgres"})\n'
        + '> pg_settings_max_connections * [[ .threshold ]] / 100',
      alert: 'PostgreSQL too many connections ({{ $labels.service_name }})',
    };
    const ruleAfterUpdate = {
      ruleName: 'QAA PSQL Update test after Update',
      threshold: '2',
      thresholdUnit: '%',
      duration: '2',
      severity: 'Error',
//eslint-disable-next-line max-len
      filters: [{ label: 'service_name_updated', operator: alertRulesPage.filterOperators.regex, value: 'pmm-server-postgresql-updated' }],
      channels: ['EmailChannelForRules', 'EmailChannelForEditRules'],
      activate: false,
    };
    const { ruleName } = rule;
    await rulesAPI.createAlertRule({ ruleName });

    await channelsAPI.createNotificationChannel('EmailChannelForEditRules', ncPage.types.email.type);
    alertRulesPage.openAlertRulesTab();
    I.click(alertRulesPage.buttons.editAlertRule(rule.ruleName));
    alertRulesPage.verifyEditRuleDialogElements(rule, true);
    await alertRulesPage.fillRuleFields(ruleAfterUpdate);
    I.click(alertRulesPage.buttons.addRule);
    I.verifyPopUpMessage(alertRulesPage.messages.successfullyEdited);
    alertRulesPage.verifyRowValues(ruleAfterUpdate);

    await rulesAPI.removeAlertRule(ruleId);
  },
);

Data(rulesStates).Scenario(
  'PMM-T566 Verify user can copy Alert rule @ia @grafana-pr',
  async ({
    I, alertRulesPage, rulesAPI, current,
  }) => {
    const rule = {
      ruleName: 'QQAA PSQL duplicate test',
      disabled: current.disabled,
    };
    const ruleCopy = {
      ruleName: `Copy of ${rule.ruleName}`,
      threshold: '1',
      thresholdUnit: '%',
      duration: '1',
      severity: 'Critical',
      filters: [{ label: 'service_name', operator: alertRulesPage.filterOperators.equal, value: 'pmm-server-postgresql' }],
      channels: [],
      activate: false,
    };

    await rulesAPI.createAlertRule(rule);

    alertRulesPage.openAlertRulesTab();
    alertRulesPage.verifyRuleState(!rule.disabled, rule.ruleName);
    I.click(alertRulesPage.buttons.duplicateAlertRule(rule.ruleName));
    I.verifyPopUpMessage(alertRulesPage.messages.successfullyCreated(ruleCopy.ruleName));
    alertRulesPage.verifyRowValues(ruleCopy);

    await rulesAPI.clearAllRules();
  },
);

Data(rulesStates).Scenario(
  'PMM-T517 Verify user can delete Alert rule @ia @fb',
  async ({
    I, alertRulesPage, rulesAPI, current,
  }) => {
    const rule = {
      ruleName: 'QAA PSQL delete test',
      disabled: current.disabled,
    };

    await rulesAPI.createAlertRule(rule);

    alertRulesPage.openAlertRulesTab();
    alertRulesPage.verifyRuleState(!rule.disabled, rule.ruleName);
    I.click(alertRulesPage.buttons.deleteAlertRule(rule.ruleName));
    I.seeTextEquals(alertRulesPage.messages.deleteRuleModalHeader, alertRulesPage.elements.modalHeader);
    I.seeElement(alertRulesPage.buttons.closeModal, alertRulesPage.elements.modalHeader);
    I.seeTextEquals(alertRulesPage.messages.confirmDelete(rule.ruleName),
      locate(alertRulesPage.elements.modalContent).find('h4'));
    I.seeElement(alertRulesPage.buttons.cancelDelete);
    I.seeElement(alertRulesPage.buttons.delete);
    I.click(alertRulesPage.buttons.delete);
    I.verifyPopUpMessage(alertRulesPage.messages.successfullyDeleted(rule.ruleName));
    I.dontSeeElement(alertRulesPage.elements.rulesNameCell(rule.ruleName));
  },
);

Scenario(
  'PMM-T639 Verify alert rule details content @ia @grafana-pr',
  async ({
    I, ruleTemplatesPage, alertRulesPage, rulesAPI,
  }) => {
    const ruleName = 'QAA PSQL yaml content test';
    const ruleNameWithBuiltInTemplate = 'Rule with Built-In template';
    const exprForBuiltInTemplate = 'sum(pg_stat_activity_count{datname!~"template.*|postgres"})\n'
      + '> pg_settings_max_connections * [[ .threshold ]] / 100';
    const [,, id, expr] = await ruleTemplatesPage.ruleTemplate
      .templateNameAndContent('tests/ia/templates/templateForRules.yaml');

    await rulesAPI.createAlertRule({ ruleName }, id);
    await rulesAPI.createAlertRule({ ruleName: ruleNameWithBuiltInTemplate });
    alertRulesPage.openAlertRulesTab();
    I.click(alertRulesPage.buttons.showDetails(ruleName));
    I.seeTextEquals(expr.replace('[[ .threshold ]]', '1'),
      alertRulesPage.elements.ruleDetails);
    I.click(alertRulesPage.buttons.hideDetails(ruleName));
    I.dontSeeElement(alertRulesPage.elements.ruleDetails);
    I.click(alertRulesPage.buttons.showDetails(ruleNameWithBuiltInTemplate));
    I.seeTextEquals(exprForBuiltInTemplate.replace('[[ .threshold ]]', '1'),
      alertRulesPage.elements.ruleDetails);
    I.click(alertRulesPage.buttons.hideDetails(ruleNameWithBuiltInTemplate));
    I.dontSeeElement(alertRulesPage.elements.ruleDetails);
  },
);

// nightly candidate
Scenario(
  'PMM-T646 Verify user can not create Rule with negative duration time @ia @grafana-pr',
  async ({
    I, alertRulesPage,
  }) => {
    alertRulesPage.openAlertRulesTab();
    I.click(alertRulesPage.buttons.openAddRuleModal);

    I.waitForVisible(alertRulesPage.fields.ruleName, 30);
    alertRulesPage.searchAndSelectResult('Template', 'Memory used by MongoDB');
    I.click(alertRulesPage.elements.ruleAdvancedSectionToggle);
    I.waitForVisible(alertRulesPage.elements.expression, 30);

    I.clearField(alertRulesPage.fields.duration);
    I.fillField(alertRulesPage.fields.duration, '-1');

    I.seeTextEquals('Must be greater than or equal to 1', alertRulesPage.elements.durationError);
    I.seeElementsDisabled(alertRulesPage.buttons.addRule);

    I.clearField(alertRulesPage.fields.duration);
    I.fillField(alertRulesPage.fields.duration, '1');

    I.seeTextEquals('', alertRulesPage.elements.durationError);
  },
);

Scenario(
  'PMM-T1116 Verify user is able to copy alert rule, source template of which was deleted @ia',
  async ({
    I, ruleTemplatesPage, alertRulesPage, rulesAPI, templatesAPI,
  }) => {
    const ruleName = 'Rule for PMM-T1116';
    const copiedRuleName = `Copy of ${ruleName}`;
    const ruleCopy = {
      template: 'E2E TemplateForAutomation YAML',
      ruleName: copiedRuleName,
      threshold: '1',
      thresholdUnit: '%',
      duration: '1',
      severity: 'Critical',
      expression: 'max_over_time(mysql_global_status_threads_connected[5m]) / ignoring (job)\n'
                + 'mysql_global_variables_max_connections\n'
                + '* 100\n'
                + '> [[ .threshold ]]',
      alert: 'MySQL too many connections (instance {{ $labels.instance }})',
      filters: [{ label: 'service_name', operator: alertRulesPage.filterOperators.equal, value: 'pmm-server-postgresql' }],
      activate: false,
    };
    const path = ruleTemplatesPage.ruleTemplate.paths.yaml;
    const [, , id] = await ruleTemplatesPage.ruleTemplate
      .templateNameAndContent(path);

    await templatesAPI.createRuleTemplate(path);
    await rulesAPI.createAlertRule({ ruleName }, id);

    ruleTemplatesPage.openRuleTemplatesTab();
    await templatesAPI.removeTemplate(id);
    alertRulesPage.openAlertRulesTab();
    I.click(alertRulesPage.buttons.duplicateAlertRule(ruleName));
    I.verifyPopUpMessage(alertRulesPage.messages.successfullyCreated(copiedRuleName));
    I.seeElement(alertRulesPage.elements.rulesNameCell(ruleName));
    I.click(alertRulesPage.buttons.showDetails(ruleName));
    I.waitForElement(alertRulesPage.elements.ruleDetails, 30);
    const ruleDetails = await I.grabTextFrom(alertRulesPage.elements.ruleDetails);

    I.click(alertRulesPage.buttons.hideDetails(ruleName));
    I.click(alertRulesPage.buttons.showDetails(copiedRuleName));
    I.waitForElement(alertRulesPage.elements.ruleDetails, 30);
    const ruleDetails2 = await I.grabTextFrom(alertRulesPage.elements.ruleDetails);

    I.click(alertRulesPage.buttons.hideDetails(copiedRuleName));
    assert.equal(ruleDetails, ruleDetails2, `Details of rule '${ruleName}' must be the same for the rule '${copiedRuleName}'`);
    alertRulesPage.verifyRowValues(ruleCopy);
    I.click(alertRulesPage.buttons.editAlertRule(copiedRuleName));
    I.waitForVisible(alertRulesPage.fields.ruleName, 30);
    alertRulesPage.verifyEditRuleDialogElements(ruleCopy, true);

    await rulesAPI.removeAlertRule(ruleId);
  },
);
