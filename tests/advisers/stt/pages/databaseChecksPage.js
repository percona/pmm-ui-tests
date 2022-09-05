const {
  I, pmmInventoryPage, settingsAPI,
} = inject();
const assert = require('assert');
// xpath used here because locate('th').withText('') method does not work correctly
const locateChecksHeader = (header) => `//th[text()='${header}']`;
const failedCheckRow = (checkSummary) => `//tr[td[contains(., "${checkSummary}")]]`;

module.exports = {
  // insert your locators and methods here
  // setting locators
  url: 'graph/pmm-database-checks',
  allChecks: 'graph/pmm-database-checks/all-checks',
  // Database Checks page URL before 2.13 version
  oldUrl: 'graph/d/pmm-checks/pmm-database-checks',
  elements: {
    failedCheckRowByServiceName: (name) => locate('tr').withChild(locate('td').withText(name)),
    failedCheckRowBySummary: (summary) => locate('tr').withChild(locate('td').withText(summary)),
    allChecksTable: locate('div').find('$db-check-tab-content'),
    allChecksTableRows: locate('div').find('$db-check-tab-content').withDescendant(locate('tr')),
  },
  messages: {
    homePagePanelMessage: 'Advisor Checks feature is disabled.\nCheck PMM Settings.',
    disabledSTTMessage: 'Advisor Checks feature is disabled. You can enable it in',
  },
  buttons: {
    toggleSilenced: locate('$db-checks-failed-checks-toggle-silenced').find('label'),
    toggleFailedCheckBySummary: (checkSummary) => locate(failedCheckRow(checkSummary)).find('$silence-button'),
  },
  fields: {
    dbCheckPanelSelector: '$db-check-tab-content',
    dbCheckPanelEmptySelector: '$db-check-panel-table-empty',
    sttEnabledDBCheckPanelSelector: '$db-check-panel-home',
    disabledSTTMessageSelector: '$db-check-panel-settings-link',
    serviceNameSelector: 'tr > td[rowspan]:first-child',
    totalFailedChecksTooltipSelector: '.popper > div > div > div:first-of-type',
    failedChecksTooltipSelector: '.popper > div > div > div',
    serviceNameHeaderSelector: locateChecksHeader('Service Name'),
    detailsHeaderSelector: locateChecksHeader('Details'),
    noOfFailedChecksHeaderSelector: locateChecksHeader('Failed Checks'),
    disabledSTTMessageLinkSelector: locate('$db-check-panel-settings-link'),
    failedChecksRowSelector: 'tbody > tr',
    tooltipSelector: locate('.ant-tooltip-inner > div > div').first(),
    noAccessRightsSelector: '$unauthorized',
  },
  checks: {
    anonymous: [
      'MongoDB Authentication',
      'MonogDB IP bindings',
      'MongoDB CVE Version',
      'MongoDB localhost authentication bypass enabled',
      'MongoDB Version',
      'Check if binaries are 32 bits',
      'MySQL Version',
      'PostgreSQL fsync is set to off',
      'PostgreSQL max_connections is too high.',
      'PostgreSQL Super Role',
      'PostgreSQL Version',
    ],
    registered: [
      'MongoDB Active vs Available Connections',
      'MongoDB Journal',
      'MongoDB Replica Set Topology',
      'MySQL Automatic User Expired Password',
      'MySQL Binary Logs checks, Local infile and local infile.',
      'MySQL Users With Granted Public Networks Access',
      'MySQL test Database',
      'Configuration change requires restart/reload.',
      'PostgreSQL Checkpoints Logging is Disabled.',
    ],
    registeredOnly: ['MySQL User check'],
    paid: [
      'MongoDB Security AuthMech Check',
      'MongoDB Non-Default Log Level',
      'MongoDB Read Tickets',
      'MongoDB write Tickets',
      'InnoDB flush method and File Format check.',
      'Checks based on values of MySQL configuration variables',
      'MySQL configuration check',
      'MySQL User check (advanced)',
      'MySQL security check',
      'PostgreSQL Archiver is failing',
      'PostgreSQL cache hit ratio',
      'PostgreSQL Autovacuum Logging Is Disabled',
      'PostgreSQL Stale Replication Slot',
    ],
  },
  // introducing methods

  // Info icon locator in Failed Checks column for showing tooltip with additional information
  failedChecksInfoLocator(rowNumber = 1) {
    return `//tbody/tr[${rowNumber}]/td[1]/following-sibling::td/div/span[2]`;
  },
  // Locator for checks results in Failed Checks column
  numberOfFailedChecksLocator(rowNumber = 1) {
    return `//tbody/tr[${rowNumber}]/td[1]/following-sibling::td/div/span[1]`;
  },

  openDBChecksPage() {
    I.amOnPage(this.url);
  },

  openFailedChecksListForService(serviceId) {
    I.amOnPage(`${this.url}/failed-checks/${serviceId.split('/')[2]}`);
    I.waitForVisible('td', 30);
  },

  verifyFailedCheckNotExists(checkSummary, serviceId) {
    this.openFailedChecksListForService(serviceId);
    I.dontSee(checkSummary);
  },

  verifyFailedCheckExists(checkSummary, serviceId) {
    this.openFailedChecksListForService(serviceId);
    I.see(checkSummary);
  },
  /*
   Method for verifying elements on a page when STT is enabled and disabled
   default state is enabled
   */
  verifyDatabaseChecksPageElements(stt = 'enabled') {
    switch (stt) {
      case 'enabled':
        I.seeElement(this.fields.dbCheckPanelSelector);
        I.dontSeeElement(this.fields.disabledSTTMessageSelector);
        I.dontSeeElement(this.fields.disabledSTTMessageLinkSelector);
        I.seeElement(this.fields.serviceNameHeaderSelector);
        I.seeElement(this.fields.noOfFailedChecksHeaderSelector);
        I.seeElement(this.fields.detailsHeaderSelector);
        break;
      case 'disabled':
        I.waitForVisible(this.fields.disabledSTTMessageSelector, 30);
        I.seeElement(this.fields.dbCheckPanelSelector);
        I.see(this.messages.disabledSTTMessage, this.fields.disabledSTTMessageSelector);
        I.seeElement(this.fields.disabledSTTMessageLinkSelector);
        I.dontSeeElement(this.fields.serviceNameHeaderSelector);
        I.dontSeeElement(this.fields.noOfFailedChecksHeaderSelector);
        I.dontSeeElement(this.fields.detailsHeaderSelector);
        break;
      default:
    }
  },

  // Method used to verify elements on a page depending on STT state
  // Contains if statements to avoid situations when another test disables STT
  // while we expect it to be enabled and vice versa
  async verifyDatabaseChecksPageOpened(stt = 'enabled') {
    I.waitForVisible(this.fields.dbCheckPanelSelector, 30);
    const disabledSTT = await I.grabNumberOfVisibleElements(this.fields.disabledSTTMessageSelector);

    switch (stt) {
      case 'enabled':
        if (disabledSTT) {
          await settingsAPI.apiEnableSTT();
          I.refreshPage();
        }

        I.waitForVisible(this.fields.serviceNameHeaderSelector, 30);
        this.verifyDatabaseChecksPageElements(stt);
        break;
      case 'disabled':
        if (!disabledSTT) {
          await settingsAPI.apiDisableSTT();
          I.refreshPage();
        }

        this.verifyDatabaseChecksPageElements(stt);
        break;
      default:
    }
  },

  // Compares values in tooltip with values in table
  async compareTooltipValues(rowNumber = 1) {
    let tableNumbers = await I.grabTextFrom(this.numberOfFailedChecksLocator(rowNumber));
    const tooltipTotalNumber = await I.grabTextFrom(this.fields.totalFailedChecksTooltipSelector);
    const tooltipNumbers = await I.grabTextFromAll(this.fields.failedChecksTooltipSelector);

    tableNumbers = tableNumbers.split(/[^0-9]+/g);
    tableNumbers.pop();
    tooltipNumbers.shift();
    const detailsFromTable = `Critical – ${tableNumbers[1]}\nMajor – ${tableNumbers[2]}\nTrivial – ${tableNumbers[3]}`;

    assert.equal(`Failed checks: ${tableNumbers[0]}`, tooltipTotalNumber);
    assert.equal(detailsFromTable, tooltipNumbers);
  },

  mouseOverInfoIcon(row) {
    I.moveCursorTo(this.failedChecksInfoLocator(row));
    I.waitForVisible(this.fields.totalFailedChecksTooltipSelector, 30);
    I.seeElement(this.fields.totalFailedChecksTooltipSelector);
  },

  async verifyServiceNamesExistence(serviceName) {
    I.see(serviceName);

    I.amOnPage(pmmInventoryPage.url);
    I.waitForVisible(pmmInventoryPage.fields.inventoryTableColumn, 30);
    I.scrollPageToBottom();

    I.seeElement(locate('$table-row').find('td').withText(serviceName));
  },
  async verifyAdvisorCheckExistence(advisorName) {
    I.waitForVisible(this.elements.allChecksTableRows, 30);
    I.seeElement(this.elements.allChecksTableRows.withText(advisorName));
  },

  async verifyAdvisorCheckIsNotPresent(advisorName) {
    I.waitForVisible(this.elements.allChecksTableRows, 30);
    I.dontSeeElement(this.elements.allChecksTableRows.withText(advisorName));
  },
};
