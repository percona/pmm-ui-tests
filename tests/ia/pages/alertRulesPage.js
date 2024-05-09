const { I } = inject();
const { rules, templates, filterOperators } = require('./testData');

module.exports = {
  url: 'graph/alerting/list',
  columnHeaders: ['State', 'Name', 'Health', 'Summary'],
  filterOperators,
  rules,
  templates,
  alertRuleFilters: ['Firing', 'Normal', 'Pending', 'Alert', 'Recording', 'List', 'Grouped', 'State'],
  elements: {
    noRules: locate('//p[text()="You haven\'t created any alert rules yet"]'),
    columnHeaderLocator: (columnHeaderText) => locate('$header').withText(columnHeaderText),
    ruleNameValue: 'div[data-column=\'Name\']',
    ruleDetails: 'div[data-testid=\'expanded-content\']',
    searchByDataSourceDropdown: '//div[@aria-label="Data source picker select container"]',
    searchByLabel: '$input-wrapper',
    // eslint-disable-next-line no-inline-comments
    ruleFilterLocator: (ruleFilterText) => locate('label').withText(ruleFilterText).after('//input[@type="radio"]'),
    // eslint-disable-next-line no-inline-comments
    totalRulesCounter: (count, folder) => locate('$rule-group-header').withText(folder).find('span').withText(count),
    alertsLearnMoreLinks: locate('a').withText('Learn more'),
    detailsEvaluateValue: '//div[text()="Evaluate"]/following-sibling::div',
    detailsDurationValue: '//div[text()="Pending period"]/following-sibling::div',
    detailsSeverityLabel: (value) => locate('div').withText('severity').before(`//*[text()='${value}']`),
    detailsFolderLabel: (value) => locate('div').withAttr({ 'aria-label': `grafana_folder: ${value}` }).inside('//div[@data-column="Labels"]'),
    ruleValidationError: (error) => locate('div').withText(error).inside('div').withAttr({ role: 'alert' }),
    evaluationGroupOption: (evaluationGroupName) => locate(I.useDataQA(`${evaluationGroupName}-select-option`)),
    alertStatus: (ruleName) => locate(`//*[@data-column ='Name' and contains(text(), '${ruleName}')]//preceding-sibling::*[@data-column ='State']`),
  },
  buttons: {
    newAlertRule: '//a[contains(.,\'New alert rule\')]',
    newAlertRuleFromTemplate: locate('a').withText('New alert rule from template'),
    saveAndExit: locate('button').withText('Save rule and exit'),
    editAlertRule: '//a[@title="Edit"]',
    editRuleOnView: '//span[text()="Edit"]',
    moreOptions: locate('span').withText('More').inside('button'),
    deleteAlertRule: locate('span').withText('Delete').inside('button'),
    groupCollapseButton: (folderText, groupText) => locate(`//div[contains(., '${folderText}') and contains(., '${groupText}')]//preceding-sibling::button[@data-testid="group-collapse-toggle"]`),
    ruleCollapseButton: 'button[aria-label=\'Expand row\']',
    goToFolderButton: (folderID, folderText) => locate('[aria-label="go to folder"]').withAttr({ href: `/graph/dashboards/f/${folderID}/${folderText}` }),
    managePermissionsButton: (folderID, folderText) => locate('[aria-label="manage permissions"]').withAttr({ href: `/graph/dashboards/f/${folderID}/${folderText}/permissions` }),
    confirmModal: locate(I.useDataQA('data-testid Confirm Modal Danger Button')),
    cancelModal: locate('button').withText('Cancel'),
    newEvaluationGroup: locate('button').withText('New evaluation group'),
    createNewEvaluationGroup: locate('button').withText('Create'),
    addFilter: locate('span').withText('Add Filter'),
  },
  fields: {
    // searchDropdown returns a locator of a search input for a given label
    searchDropdown: (option) => `//div[@id='${option}']`,
    folderLocator: I.useDataQA('data-testid Folder picker select container'),
    groupSelect: locate('[id="group"]'),
    dropdownValue: (option) => `//*[@id='${option}']/div/div[1]/div[1]`,
    // resultsLocator returns item locator in a search dropdown based on a text
    resultsLocator: (name) => `//div[@aria-label="Select option"]//div//span[text()="${name}"]`,
    inputField: (input) => `input[name='${input}']`,
    editRuleThreshold: 'input[name=\'evaluateFor\']',
    editRuleEvaluate: 'input[name=\'evaluateEvery\']',
    editRuleSeverity: locate(I.useDataQA('label-value-1')).find('input'),
    templatesLoader: locate('//div[@id=\'template\']').find('div').withText('Choose'),
    newEvaluationGroupName: locate('input').withAttr({ name: 'group' }),
    newEvaluationGroupInterval: locate('input').withAttr({ name: 'evaluateEvery' }),
    filterLabel: locate('input').withAttr({ placeholder: 'Label' }),
    filterOperators: locate('//*[text()="Operators"]//following-sibling::*//input'),
    filterRegex: locate('input').withAttr({ placeholder: 'Regex' }),
  },
  messages: {
    noRulesFound: 'You haven`t created any alert rules yet',
    confirmDelete: (ruleName) => `Deleting "${ruleName}" will permanently remove it from your alert rule list.`,
    successRuleCreate: (name) => `Rule "${name}" saved.`,
    successRuleEdit: (name) => `Rule "${name}" updated.`,
    successfullyDeleted: 'Rule deleted.',
    failRuleCreate: 'There are errors in the form. Please correct them and try again!',
    failRuleCreateDuration: 'Failed to save rule: Duration (0s) can\'t be shorter than evaluation interval for the given group (1m0s).; Duration (0s) can\'t be shorter than evaluation interval for the given group (1m0s).',
  },

  async fillPerconaAlert(defaultRuleObj, newruleObj) {
    const {
      template, ruleName, threshold, duration, severity,
    } = defaultRuleObj;

    const editedRule = {
      ruleName: newruleObj.ruleName || 'test',
      threshold: newruleObj.threshold || '1',
      duration: newruleObj.duration || '2m',
      severity: newruleObj.severity || 'Debug',
      folder: newruleObj.folder || 'Insight',
      group: newruleObj.group || { name: 'TestGroup', evaluationInterval: '30s' },
    };

    I.waitForElement(this.fields.templatesLoader);
    this.searchAndSelectResult('template', template);
    this.verifyAndReplaceInputField('ruleName', ruleName, editedRule.ruleName);
    const thresholdExists = await I.grabNumberOfVisibleElements(this.fields.resultsLocator(threshold));

    if (thresholdExists > 0) {
      this.verifyAndReplaceInputField('threshold', threshold, editedRule.threshold);
    }

    this.verifyAndReplaceInputField('duration', duration, editedRule.duration);
    I.see(severity, this.fields.searchDropdown('severity'));
    this.searchAndSelectResult('severity', editedRule.severity);
    this.selectFolder(editedRule.folder);
    await this.selectOrCreateGroup(editedRule.group);
    if (newruleObj.filter) {
      this.createFilter(newruleObj.filter);
    }
  },

  async editPerconaAlert(ruleObj) {
    const {
      ruleName, duration, severity, folder, group,
    } = ruleObj;

    I.waitForVisible(this.fields.inputField('name'));
    I.fillField(this.fields.inputField('name'), ruleName);
    this.selectFolder(folder);
    this.editRuleSeverity(severity);
    I.fillField(this.fields.editRuleThreshold, duration);
    await this.selectOrCreateGroup(group);
    I.click(this.buttons.saveAndExit);
    I.verifyPopUpMessage(this.messages.successRuleEdit(ruleName));
  },

  editRuleSeverity(newSeverity) {
    I.waitForVisible(this.fields.editRuleSeverity);
    I.click(this.fields.editRuleSeverity);
    I.fillField(this.fields.editRuleSeverity, newSeverity);
    I.pressKey('Enter');
  },

  openAlertRulesTab() {
    I.amOnPage(this.url);
    I.waitForVisible(this.buttons.newAlertRule, 30);
  },

  searchAndSelectResult(dropdownLabel, option) {
    I.waitForElement(this.fields.searchDropdown(dropdownLabel));
    I.click(this.fields.searchDropdown(dropdownLabel));
    I.waitForElement(this.fields.resultsLocator(option));
    I.click(this.fields.resultsLocator(option));
  },

  verifyAndReplaceInputField(fieldName, oldValue, newValue) {
    I.waitForValue(this.fields.inputField(fieldName), oldValue);
    I.clearField(this.fields.inputField(fieldName));
    I.fillField(this.fields.inputField(fieldName), newValue);
  },

  selectFolder(option) {
    I.waitForElement(this.fields.folderLocator);
    I.click(this.fields.folderLocator);
    I.waitForElement(this.fields.resultsLocator(option));
    I.click(this.fields.resultsLocator(option));
  },

  createFilter(filter) {
    I.waitForVisible(this.buttons.addFilter);
    I.click(this.buttons.addFilter);
    I.fillField(this.fields.filterLabel, filter.label);
    I.fillField(this.fields.filterOperators, filter.operator);
    I.pressKey('Enter');
    I.fillField(this.fields.filterRegex, filter.regex);
  },

  async selectOrCreateGroup(groupOptions) {
    I.waitForElement(this.fields.groupSelect);
    I.click(this.fields.groupSelect);
    const numberOfElements = await I.grabNumberOfVisibleElements(this.elements.evaluationGroupOption(groupOptions.name));

    if (numberOfElements) {
      const groupDetails = await I.grabTextFrom(this.elements.evaluationGroupOption(groupOptions.name));

      I.assertContain(
        groupDetails,
        groupOptions.evaluationInterval,
        'Group with selected evaluation name but wrong evaluation interval already exists, group name has to be unique.',
      );
      I.forceClick(this.elements.evaluationGroupOption(groupOptions.name));

      return;
    }

    I.forceClick(this.buttons.newEvaluationGroup);
    I.waitForElement(this.fields.newEvaluationGroupName);
    I.fillField(this.fields.newEvaluationGroupName, groupOptions.name);
    I.fillField(this.fields.newEvaluationGroupInterval, groupOptions.evaluationInterval);
    I.click(this.buttons.createNewEvaluationGroup);
  },

  verifyRuleDetails(ruleObj) {
    const {
      ruleName, duration, folder, severity, group,
    } = ruleObj;

    this.verifyRuleList(folder, ruleName, group.name);
    I.seeElement(this.buttons.ruleCollapseButton);
    I.click(this.buttons.ruleCollapseButton);
    I.waitForElement(this.elements.ruleDetails);
    I.see(duration, this.elements.detailsDurationValue);
    I.waitForElement(this.elements.detailsSeverityLabel(severity));
    I.waitForElement(this.elements.detailsFolderLabel(folder));
    I.see(folder, this.elements.detailsFolderLabel(folder));
  },

  verifyRuleList(folder, ruleName, groupName) {
    I.waitForVisible(this.buttons.groupCollapseButton(folder, groupName));
    I.click(this.buttons.groupCollapseButton(folder, groupName));
    I.seeTextEquals(ruleName, this.elements.ruleNameValue);
  },

  async verifyRuleState(newRule, status, timeOut) {
    const ariaAttr = await I.grabAttributeFrom(this.buttons.groupCollapseButton(newRule.folder, newRule.group.name), 'aria-expanded');

    if (!ariaAttr) {
      I.click(this.buttons.groupCollapseButton(newRule.folder, newRule.group.name));
    }

    I.waitForText(status, timeOut, this.elements.alertStatus(newRule.ruleName));
  },
};
