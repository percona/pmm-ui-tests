const { I } = inject();
const { createAlertRule } = require('./api/rulesAPI');
const { rules, templates, filterOperators } = require('./testData');

const rulesNameCell = (ruleName) => `//td[1][div/span[text()="${ruleName}"]]`;

module.exports = {
  url: 'graph/alerting/list',
  columnHeaders: ['State', 'Name', 'Health', 'Summary'],
  filterOperators,
  rules,
  templates,
  alertRuleFilters: ['Firing', 'Normal', 'Pending', 'Alert', 'Recording', 'List', 'Grouped', 'State'],
  elements: {
    rulesTab: '//div/a[@aria-label="Tab Alert Rules"]',
    noRules: 'div.page-body > div',
    rulesTableHeader: '$alert-rules-table-thead',
    rulesTable: '$alert-rules-table-tbody',
    rulesNameCell: (ruleName) => rulesNameCell(ruleName),
    // activateSwitch returns enable/disabled rule switch locator which holds the state (enabled or disabled)
    // Note: not clickable one
    activateSwitch: (ruleName) => `${rulesNameCell(ruleName)}/following-sibling::td//input[@data-testid='toggle-alert-rule']`,
    parametersCell: (ruleName) => locate('td').after(rulesNameCell(ruleName)).find('$alert-rule-param'),
    durationCell: (ruleName) => `${rulesNameCell(ruleName)}/following-sibling::td[2]`,
    severityCell: (ruleName) => `${rulesNameCell(ruleName)}/following-sibling::td[3]`,
    filtersCell: (ruleName) => `${rulesNameCell(ruleName)}/following-sibling::td[4]//span`,
    modalHeader: '$modal-header',
    modalContent: '$modal-content',
    columnHeaderLocator: (columnHeaderText) => locate('$header').withText(columnHeaderText),
    ruleDetails: '$alert-rules-details',
    expression: locate('$template-expression').find('pre'),
    templateAlert: locate('$template-alert').find('pre'),
    durationError: '$duration-field-error-message',
    ruleAdvancedSectionToggle: locate('$alert-rule-advanced-section').find('//*[text()="Advanced details"]'),
    tooltipMessage: '.popper__background',
    //todo: move?
    searchByDataSourceDropdown: '//div[@aria-label="Data source picker select container"]',
    searchByLabel: '$input-wrapper',
    ruleFilterLocator: (ruleFilterText) => locate('label').withText(ruleFilterText).after('//input[@type="radio"]'), //locateLabel
    totalRulesCounter: (count, folder) => locate('$rule-group-header').withText(folder), //todo
    alertsLearnMoreLinks: locate('a').withText('Learn more'),
  },
  buttons: {
    openAddRuleModal: `//a[contains(.,'New alert rule')]`,
    editRule: '$edit-alert-rule-button',
    closeModal: '$modal-close-button',
    addRule: locate('button').withText('Save and exit'),
    cancelAdding: '$add-alert-rule-modal-cancel-button',
    cancelDelete: '$cancel-delete-modal-button',
    delete: '$confirm-delete-modal-button',
    addFilter: '$add-filter-button',
    deleteFilter: (number = 1) => locate('$delete-filter-button').at(number),
    // showDetails returns Show rule details button locator for a given rule name
    showDetails: (ruleName) => `${rulesNameCell(ruleName)}//button[@data-testid="show-details"]`,
    // hideDetails returns Hide rule details button locator for a given rule name
    hideDetails: (ruleName) => `${rulesNameCell(ruleName)}//button[@data-testid="hide-details"]`,
    // editAlertRule returns Edit rule button locator for a given rule name
    editAlertRule: (ruleName) => `${rulesNameCell(ruleName)}/following-sibling::td//button[@data-testid='edit-alert-rule-button']`,
    // duplicateAlertRule returns Copy rule button locator for a given rule name
    duplicateAlertRule: (ruleName) => `${rulesNameCell(ruleName)}/following-sibling::td//button[@data-testid='copy-alert-rule-button']`,
    // deleteAlertRule returns Delete rule button locator for a given rule name
    deleteAlertRule: (ruleName) => `${rulesNameCell(ruleName)}/following-sibling::td//button[@data-testid='delete-alert-rule-button']`,
    // toggleAlertRule returns Enable/Disable rule switch locator in alert rules list
    toggleAlertRule: (ruleName) => `${rulesNameCell(ruleName)}/following-sibling::td//input[@data-testid='toggle-alert-rule']/following-sibling::label`,
    toggleInModal: '//input[@data-testid="enabled-toggle-input"]/following-sibling::label',
    groupCollapseButton: (folderText) =>  `//button[@data-testid='group-collapse-toggle'][following::h6[contains(., '${folderText}')]]`,
    editFolderButton: (folderID, folderText)  => locate('[aria-label="edit folder"]').withAttr({ 'href': `/graph/dashboards/f/${folderID}/${folderText}/settings` }),
    managePermissionsButton: (folderID, folderText)  => locate('[aria-label="manage permissions"]').withAttr({ 'href': `/graph/dashboards/f/${folderID}/${folderText}/permissions` }),
  },
  tooltips: {
    template: {
      locator: locate('div').after('$template-field-label'),
      message: 'The alert template to use for this rule.',
    },
    name: {
      locator: locate('div').after('$name-field-label'),
      message: 'The name for this rule.',
    },
    duration: {
      locator: locate('div').after('$duration-field-label'),
      message: 'The alert query duration, in seconds.',
    },
    severity: {
      locator: locate('div').after('$severity-field-label'),
      message: 'The severity level for the alert triggered by this rule.',
    },
    filters: {
      locator: locate('div').after('$filters-field-label'),
      message: 'Apply rule only to required services or nodes.',
    },
    channels: {
      locator: locate('div').after('$notificationChannels-field-label'),
      message: 'Which notification channels should be used to send the alert through.',
    },
  },
  fields: {
    // searchDropdown returns a locator of a search input for a given label
    searchDropdown: (option) => `//div[@id='${option}']`,
    folderLocator: I.useDataQA('data-testid Folder picker select container'),
    dropdownValue: (option) => `//*[@id='${option}']/div/div[1]/div[1]`,
    // resultsLocator returns item locator in a search dropdown based on a text
    resultsLocator: (name) => `//div[@aria-label="Select option"]//div//span[text()="${name}"]`,
    ruleName: '$name-text-input', //todo: remove everywhere
    inputField: (input) => `input[name='${input}']`,
    duration: '$duration-number-input', //todo: remove everywhere
    filtersLabel: (index = 0) => I.useDataQA(`filters[${index}].label-text-input`),
    filtersValue: (index = 0) => I.useDataQA(`filters[${index}].value-text-input`),
    template: '//form[@data-testid="add-alert-rule-modal-form"]/div[2]//div[contains(@class, "singleValue")]',
  },
  messages: {
    noRulesFound: 'No alert rules found',
    addRuleModalHeader: 'Add Alert Rule',
    deleteRuleModalHeader: 'Delete Alert Rule',
    confirmDelete: (name) => `Are you sure you want to delete the alert rule "${name}"?`,
    successfullyAdded: 'Alert rule created',
    successfullyCreated: (name) => `Alert rule ${name} successfully created`,
    successRuleCreated: (name) => `Rule "${name}" saved.`,
    successfullyEdited: 'Alert rule updated',
    successfullyDeleted: (name) => `Alert rule ${name} successfully deleted`,
    successfullyDisabled: (name) => `Alert rule "${name}" successfully disabled`,
    successfullyEnabled: (name) => `Alert rule "${name}" successfully enabled`,
  },

  async fillPerconaAlert(template, alertObj) {
    // const {
    //   ruleName, threshold, duration,
    //   severity, filters = '', channels, activate,
    // } = alertObj;

    I.waitForVisible(this.fields.searchDropdown('template'));
    this.searchAndSelectResult('template', 'Node high CPU load');

    //TODO: DNR

    I.waitForValue(this.fields.inputField('name'), 'pmm_node_high_cpu_load Alerting Rule');
    I.clearField(this.fields.inputField('name'));
    I.fillField(this.fields.inputField('name'), 'Node high CPU load');

    I.waitForValue(this.fields.inputField('threshold'), '80');
    I.clearField(this.fields.inputField('threshold'));
    I.fillField(this.fields.inputField('threshold'), 0);

    I.waitForValue(this.fields.inputField('duration'), '300s');
    I.clearField(this.fields.inputField('duration'));
    I.fillField(this.fields.inputField('duration'), '1m');

    this.searchAndSelectResult('severity', 'Emergency');
    this.selectFolder('Experimental');
  },

  async fillRuleFields(ruleObj = this.rules[0]) {
    const {
      template, ruleName, threshold, duration,
      severity, filters = '', channels, activate,
    } = ruleObj;

    // skipping this step while editing an Alert rule
    if (template) {
      this.searchAndSelectResult('Template', template);
    }

    I.clearField(this.fields.ruleName);
    I.fillField(this.fields.ruleName, ruleName);
    I.clearField(this.fields.threshold);
    I.fillField(this.fields.threshold, threshold);
    I.clearField(this.fields.duration);
    I.fillField(this.fields.duration, duration);
    this.searchAndSelectResult('Severity', severity);

    // delete filters if they exist
    const numberOfFilters = await I.grabNumberOfVisibleElements(this.buttons.deleteFilter());

    if (numberOfFilters) {
      for (let i = 0; i < numberOfFilters; i++) {
        I.click(this.buttons.deleteFilter());
      }
    }

    if (filters) {
      filters.forEach(({ label, operator, value }, num) => {
        I.click(this.buttons.addFilter);
        I.fillField(this.fields.filtersLabel(num), label);
        I.fillField(this.fields.filtersValue(num), value);
        I.fillField(locate(this.fields.searchDropdown('Operators')).at(num + 1), operator);
        I.click(this.fields.resultsLocator(operator));
      });
    }

    if (channels) {
      channels.forEach((channel) => {
        this.searchAndSelectResult('Channels', channel);
      });
    }

    if (!activate) {
      I.click(this.buttons.toggleInModal);
    }
  },

  verifyEditRuleDialogElements(rule, openAdvancedSection = false) {
    const {
      template, ruleName = '', threshold, duration,
      filters = '', expression, alert,
    } = rule;

    I.waitForVisible(this.fields.template, 30);
    I.seeTextEquals(template, this.fields.template);
    I.waitForValue(this.fields.ruleName, ruleName, 10);
    if (threshold) {
      I.waitForValue(this.fields.threshold, threshold, 10);
    } else {
      I.dontSeeElement(this.fields.threshold);
    }

    I.waitForValue(this.fields.duration, duration, 10);
    I.seeElement(this.buttons.addFilter);

    if (filters) {
      filters.forEach(({ label, operator, value }) => {
        I.waitForValue(this.fields.filtersLabel(), label, 5);
        I.waitForValue(this.fields.filtersValue(), value, 5);
        I.seeTextEquals(operator, this.fields.dropdownValue('Operators'));
      });
    } else {
      I.dontSeeElement(this.fields.filtersLabel());
      I.dontSeeElement(this.fields.filtersValue());
    }

    if (openAdvancedSection) {
      I.click(this.elements.ruleAdvancedSectionToggle);
    }

    I.seeTextEquals(expression, this.elements.expression);
    I.seeTextEquals(alert, this.elements.templateAlert);
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

  selectFolder(option) {
    I.click(this.fields.folderLocator);
    I.fillField(this.fields.folderLocator, option);
    I.click(this.fields.resultsLocator(option));
  },

  verifyRowValues(ruleObj) {
    const {
      ruleName, threshold, duration,
      severity, filters = [], activate, thresholdUnit = '%',
    } = ruleObj;

    I.seeElement(this.elements.rulesNameCell(ruleName));
    I.see(`Threshold:\n${threshold} ${thresholdUnit}`, this.elements.parametersCell(ruleName));
    I.see(`${duration} seconds`, this.elements.durationCell(ruleName));
    I.see(severity, this.elements.severityCell(ruleName));
    // for cases when there are few filters
    filters.forEach(({ label, operator, value }) => {
      let operatorSign;

      operator === this.filterOperators.equal
        ? operatorSign = '='
        : operatorSign = '=~';
      I.see(`${label}${operatorSign}${value}`, this.elements.filtersCell(ruleName));
    });
    this.verifyRuleState(activate, ruleName);
    I.seeElementsEnabled(this.buttons.showDetails(ruleName));
    I.seeElementsEnabled(this.buttons.deleteAlertRule(ruleName));
    I.seeElementsEnabled(this.buttons.editAlertRule(ruleName));
    I.seeElementsEnabled(this.buttons.duplicateAlertRule(ruleName));
  },

  verifyRuleState(activate, ruleName) {
    let checked = activate;

    if (!activate) checked = null;

    I.waitForVisible(this.elements.activateSwitch(ruleName), 30);
    I.seeAttributesOnElements(this.elements.activateSwitch(ruleName), { checked });
  },
};
