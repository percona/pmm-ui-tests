const assert = require('assert');

const {
  I, alertRulesPage, ruleTemplatesPage, rulesAPI, templatesAPI, alertsPage, alertsAPI,
} = inject();

module.exports = {
  tabNames: {
    firedAlerts: 'Fired alerts',
    ruleTemplates: 'Alert rule templates',
    alertRules: 'Alert rules',
    contactPoints: 'Contact points',
    notificationPolicies: 'Notification policies',
    silences: 'Silences',
    alertGroups: 'Alert groups',
    admin: 'Admin',
  },
  elements: {
    noData: locate('$table-no-data').find('h1'),
    pagination: '$pagination',
    itemsShown: '$pagination-items-inverval',
    rowInTable: locate('$table-tbody').find('tr'),
    tab: (tabName) => locate('div').withAttr({ 'aria-label': `${tabName}` }),
    table: '$table-tbody',
    disabledIa: '$empty-block',
    settingsLink: '$settings-link',
    selectDropdownOption: (option) => `$${option}-select-option`,
    inputField: (id) => `input[id='${id}']`,
    modalDialog: locate('div[role=\'dialog\']'),

  },
  buttons: {
    firstPageButton: '$first-page-button',
    prevPageButton: '$previous-page-button',
    pageButton: '$page-button',
    pageButtonActive: '$page-button-active',
    nextPageButton: '$next-page-button',
    lastPageButton: '$last-page-button',
    rowsPerPage: locate('$pagination').find('div[class*="-singleValue"]'),
    rowsPerPageOption: (count) => locate('[aria-label="Select option"] span').withText(count.toString()),
    expandAlertingMenu: locate('button').withAttr({ 'aria-label': 'Expand section Alerting' }),
  },
  messages: {
    itemsShown: (leftNumber, rightNumber, totalItems) => `Showing ${leftNumber}-${rightNumber} of ${totalItems} items`,
    disabledIa: 'Percona Alerting is disabled. You can enable it in  \n'
      + 'PMM Settings.',
  },

  /**
   * @param  {} tabName
   * @param  {} tabUrl - expected url in tab
   */
  async openAndVerifyTab(tabName, tabUrl) {
    const expandMenu = await I.grabNumberOfVisibleElements(this.buttons.expandAlertingMenu);

    if (expandMenu) {
      I.click(this.buttons.expandAlertingMenu);
    }

    I.waitForVisible(this.elements.tab(tabName), 30);
    I.click(this.elements.tab(tabName));
    I.seeInCurrentUrl(tabUrl);
  },

  getCreateEntitiesAndPageUrl(page) {
    if (page === 'rules') {
      return {
        createEntities: rulesAPI.createAlertRules,
        url: alertRulesPage.url,
        getListOfItems: rulesAPI.getAlertRules,
      };
    }

    if (page === 'templates') {
      return {
        createEntities: templatesAPI.createRuleTemplates,
        url: ruleTemplatesPage.url,
        getListOfItems: templatesAPI.getTemplatesList,
      };
    }

    if (page === 'alerts') {
      return {
        createEntities: rulesAPI.createAlertRules,
        url: alertsPage.url,
        getListOfItems: alertsAPI.getAlertsList,
      };
    }

    return new Error('Did not met expected page. Expected: "channels", "rules" or "templates" ');
  },

  selectRowsPerPage(count) {
    I.click(this.buttons.rowsPerPage);
    I.waitForElement(this.buttons.rowsPerPageOption(count), 30);
    I.click(this.buttons.rowsPerPageOption(count));
  },

  verifyButtonState(button, disabled) {
    I.seeAttributesOnElements(button, disabled);
  },

  verifyPaginationButtonsState(state) {
    for (const [key, value] of Object.entries(state)) {
      if (this.buttons[key]) {
        I.waitForVisible(this.buttons[key], 10);
        this.verifyButtonState(this.buttons[key], this.shouldBeDisabled(value));
      } else {
        throw new Error(`Didn't find ${key} key in ${this.buttons} object`);
      }
    }
  },

  shouldBeDisabled(value) {
    return value === 'disabled' ? { disabled: true } : { disabled: null };
  },
};
