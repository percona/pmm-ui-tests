const { I } = inject();
const { createAlertRule } = require('./api/rulesAPI');
const { rules, templates, filterOperators } = require('./testData');

module.exports = {
  url: 'graph/alerting/list',
  columnHeaders: ['State', 'Name', 'Health', 'Summary'],
  filterOperators,
  rules,
  templates,
  alertRuleFilters: ['Firing', 'Normal', 'Pending', 'Alert', 'Recording', 'List', 'Grouped', 'State'],
  elements: {
    noRules: 'div.page-body > div',
    columnHeaderLocator: (columnHeaderText) => locate('$header').withText(columnHeaderText),
    ruleNameValue: `div[data-column='Name']`,
    ruleState: `//div[@data-column='State']//div//span`,
    ruleDetails: `div[data-testid='expanded-content']`,
    searchByDataSourceDropdown: '//div[@aria-label="Data source picker select container"]',
    searchByLabel: '$input-wrapper',
    // eslint-disable-next-line no-inline-comments
    ruleFilterLocator: (ruleFilterText) => locate('label').withText(ruleFilterText).after('//input[@type="radio"]'),
    // eslint-disable-next-line no-inline-comments
    totalRulesCounter: (count, folder) => locate('$rule-group-header').withText(folder).find('span').withText(count),
    alertsLearnMoreLinks: locate('a').withText('Learn more'),
    detailsEvaluateValue: `//div[text()="Evaluate"]/following-sibling::div`,
    detailsDurationValue: `//div[text()="For"]/following-sibling::div`,
    detailsSeverityLabel: (value) => locate('span').withText(`severity=${value}`).inside('//ul[@aria-label="Tags"]').at(2),
    detailsFolderLabel: (value) => locate('span').withText(`grafana_folder=${value}`).inside('//ul[@aria-label="Tags"]'),
    deleteRuleConfirmation: `//div[text()="Deleting this rule will permanently remove it from your alert rule list. Are you sure you want to delete this rule?"]`,
    ruleValidationError: (error) => locate('div').withText(error).inside('div').withAttr({ 'role': 'alert' }),
  },
  buttons: {
    openAddRuleModal: `//a[contains(.,'New alert rule')]`,
    addRule: locate('button').withText('Save and exit'),
    editAlertRule: `//a[contains(@href, 'edit?returnTo=%2Falerting%2Flist')]`,
    deleteAlertRule: locate('span').withText('Delete').inside('button'),
    groupCollapseButton: (folderText) =>  `//button[@data-testid='group-collapse-toggle'][following::h6[contains(., '${folderText}')]]`,
    ruleCollapseButton: `button[aria-label='Expand row']`,
    editFolderButton: (folderID, folderText)  => locate('[aria-label="edit folder"]').withAttr({ 'href': `/graph/dashboards/f/${folderID}/${folderText}/settings` }),
    managePermissionsButton: (folderID, folderText)  => locate('[aria-label="manage permissions"]').withAttr({ 'href': `/graph/dashboards/f/${folderID}/${folderText}/permissions` }),
    confirmModal: `button[aria-label='Confirm Modal Danger Button']`,
    cancelModal: locate('button').withText('Cancel'),
  },
  fields: {
    // searchDropdown returns a locator of a search input for a given label
    searchDropdown: (option) => `//div[@id='${option}']`,
    folderLocator: I.useDataQA('data-testid Folder picker select container'),
    dropdownValue: (option) => `//*[@id='${option}']/div/div[1]/div[1]`,
    // resultsLocator returns item locator in a search dropdown based on a text
    resultsLocator: (name) => `//div[@aria-label="Select option"]//div//span[text()="${name}"]`,
    inputField: (input) => `input[name='${input}']`,
    editRuleThreshold: `input[name='evaluateFor']`,
    editRuleEvaluate: `input[name='evaluateEvery']`,
    editRuleSeverity: I.useDataQA('label-value-1'),
  },
  messages: {
    noRulesFound: 'You haven`t created any alert rules yet',
    confirmDelete: (name) => `Are you sure you want to delete the alert rule "${name}"?`,
    successRuleCreate: (name) => `Rule "${name}" saved.`,
    successRuleEdit: (name) => `Rule "${name}" updated.`,
    successfullyDeleted: 'Rule deleted.',
    failRuleCreate: 'There are errors in the form. Please correct them and try again!',
    failRuleCreateDuration: `Failed to save rule: Duration (0s) can't be less then evaluation interval for the given group (1m0s).; Duration (0s) can't be less then evaluation interval for the given group (1m0s).`,
  },

  async fillPerconaAlert(defaultRuleObj, newruleObj) {
    const {
      template, ruleName, threshold, duration, severity
    } = defaultRuleObj;
    
    const editedRule = {
      ruleName: newruleObj.ruleName || 'test',
      threshold: newruleObj.threshold || '1',
      duration: newruleObj.duration || '2m',
      severity: newruleObj.severity || 'Debug',
      folder: newruleObj.folder || 'Insight',
    };

    // wait for templates to load
    I.wait(2);
    this.searchAndSelectResult('template', template);
    this.verifyAndReplaceInputField('name', ruleName, editedRule.ruleName);
    this.verifyAndReplaceInputField('threshold', threshold, editedRule.threshold);
    this.verifyAndReplaceInputField('duration', duration, editedRule.duration);
    I.see(severity, this.fields.searchDropdown('severity'));
    this.searchAndSelectResult('severity', editedRule.severity);
    this.selectFolder(editedRule.folder);
  },

  async editPerconaAlert(ruleObj) {
    const {
      ruleName, duration, severity, folder
    } = ruleObj;

    I.waitForVisible(this.fields.inputField('name'));
    I.fillField(this.fields.inputField('name'), ruleName);
    this.selectFolder(folder);
    I.fillField(this.fields.editRuleSeverity, severity);
    I.fillField(this.fields.editRuleThreshold, duration);
    I.fillField(this.fields.editRuleEvaluate, '10s');
    I.click(this.buttons.addRule);
    I.verifyPopUpMessage(this.messages.successRuleEdit(ruleName));
  },

  openAlertRulesTab() {
    I.amOnPage(this.url);
    I.waitForVisible(this.buttons.openAddRuleModal, 30);
  },

  searchAndSelectResult(dropdownLabel, option) {
    I.click(this.fields.searchDropdown(dropdownLabel));
    I.fillField(this.fields.searchDropdown(dropdownLabel), option);
    I.click(this.fields.resultsLocator(option));
  },

  verifyAndReplaceInputField(fieldName, oldValue, newValue) {
    I.waitForValue(this.fields.inputField(fieldName), oldValue);
    I.clearField(this.fields.inputField(fieldName));
    I.fillField(this.fields.inputField(fieldName), newValue);
  },

  selectFolder(option) {
    I.click(this.fields.folderLocator);
    I.fillField(this.fields.folderLocator, option);
    I.click(this.fields.resultsLocator(option));
  },

  verifyRuleDetails(ruleObj) {
    const {
      ruleName, threshold, duration, folder, severity, filters = [],
    } = ruleObj;

    this.verifyRuleList(folder, ruleName)
    I.seeElement(this.buttons.ruleCollapseButton);
    I.click(this.buttons.ruleCollapseButton);
    I.waitForElement(this.elements.ruleDetails);
    I.seeTextEquals(duration, this.elements.detailsDurationValue);
    I.waitForElement(this.elements.detailsSeverityLabel(severity));
    I.see(severity, this.elements.detailsSeverityLabel(severity));
    I.waitForElement(this.elements.detailsFolderLabel(folder));
    I.see(folder, this.elements.detailsFolderLabel(folder));
  },

  verifyRuleList(folder, ruleName) {
    I.waitForVisible(this.buttons.groupCollapseButton(folder));
    I.click(this.buttons.groupCollapseButton(folder));
    I.seeTextEquals(ruleName, this.elements.ruleNameValue);
  },
};
