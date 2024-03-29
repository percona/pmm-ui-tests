const assert = require('assert');

const { I, qanFilters } = inject();

module.exports = {
  root: '.query-analytics-data',
  fields: {
    columnSearchField: locate('.manage-columns').find('input'),
    // columnSearchField: 'input.ant-select-search__field',
    searchBy: '//input[contains(@name, "search")]',
  },
  buttons: {
    refresh: I.useDataQA('data-testid RefreshPicker run button'),
    addColumn: '//span[contains(text(), "Add column")]',
    copyButton: '$copy-link-button',
  },
  elements: {
    countOfItems: '$qan-total-items',
    groupBy: '$group-by',
    latencyChart: '.latency-chart-container',
    metricTooltip: '.ant-tooltip-content',
    newMetricDropdown: '.add-columns-selector-dropdown',
    noDataIcon: 'div.ant-empty-image',
    querySelector: 'div.tr-1',
    removeMetricColumn: locate('div').withChild('.anticon-minus').withText('Remove column'),
    spinner: locate('$table-loading').find('//i[contains(@class,"fa-spinner")]'),
    tableRow: 'div.tr',
    tooltip: '.overview-column-tooltip',
    tooltipQPSValue: '$qps',
    noResultTableText: locate('$table-no-data').find('h1'),
    tooltipQueryValue: locate('.ant-tooltip-inner').find('code'),
    tooltipQueryId: locate('.ant-tooltip-inner').find('h5'),
    firstQueryValue: 'div.tr-1 > div.td:nth-child(2) div > div',
    firstQueryInfoIcon: 'div.tr-1 > div.td:nth-child(2) div > svg',
    selectedRow: '.selected-overview-row',
    clipboardLink: locate(I.getPopUpLocator()).find('span'),
    mainMetricDropdown: locate('$group-by'),
    selectedMainMetric: locate('$group-by').find('//div[@class="ant-select-selection-selected-value"]'),
    tooltipContent: locate('div.tippy-content'),
  },
  messages: {
    noResultTableText: 'No queries available for this combination of filters in the selected time frame',
    copiedPopUpMessage: 'Successfully copied Query Analytics link to clipboard',
  },

  getRowLocator: (rowNumber) => `div.tr-${rowNumber}`,
  getSelectedRowLocator: (rowNumber) => `div.tr-${rowNumber}.selected-overview-row`,

  getColumnLocator: (columnName) => locate('$manage-columns-selector').withText(columnName),
  getQANMetricHeader: (metricName) => `//div[@role='columnheader']//span[contains(text(), '${metricName}')]`,

  getMetricLocatorInDropdown: (name) => locate('[role="listbox"]').find(`[label='${name}']`),

  getCellValueLocator: (rowNumber, columnNumber) => `div.tr-${rowNumber} > div:nth-child(${columnNumber + 2}) span > div > span`,
  getLoadLocator: (rowNumber) => `div.tr-${rowNumber} .td canvas`,

  // using below to concatenate locators
  getMetricSortingLocator: (columnNumber) => `(//a[@data-testid='sort-by-control'])[${columnNumber}]`,

  getGroupByOptionLocator: (option) => locate('[role="listbox"]').find(`[label="${option}"]`),

  mainMetricByName: (metricName) => locate('$group-by').find(`//div[@class="ant-select-selection-selected-value" and text()="${metricName}"]`),
  mainMetricFromDropdown: (metricName) => locate(`//li[@class="ant-select-dropdown-menu-item" and text()="${metricName}"]`),

  waitForOverviewLoaded() {
    I.waitForDetached(this.elements.spinner, 30);
    I.waitForVisible(this.root, 60);
    I.waitForVisible(this.elements.querySelector, 60);
  },

  // Wait For Results count to be changed
  async waitForNewItemsCount(originalCount) {
    for (let i = 0; i < 5; i++) {
      I.wait(1);
      const count = this.getCountOfItems();

      if (count !== originalCount) {
        return count;
      }
    }

    return false;
  },

  async getCountOfItems() {
    I.waitForVisible(this.elements.querySelector, 30);
    const resultsCount = (await I.grabTextFrom(this.elements.countOfItems)).split(' ');

    return resultsCount[2];
  },

  changeMetric(columnName, metricName) {
    const newMetric = this.getColumnLocator(metricName);
    const metricInDropdown = this.getMetricLocatorInDropdown(metricName);
    const oldMetric = this.getColumnLocator(columnName);

    I.waitForElement(oldMetric, 30);
    I.waitForVisible(qanFilters.elements.filterName, 30);

    // Hardcoded wait because of random failings
    I.wait(3);
    I.click(oldMetric);
    I.waitForElement(this.fields.columnSearchField, 10);
    I.click(metricInDropdown);
    I.waitForElement(newMetric, 30);
    I.seeElement(newMetric);
    I.dontSeeElement(oldMetric);
  },

  async changeMainMetric(newMainMetric) {
    const oldMainMetric = await I.grabTextFrom(this.elements.selectedMainMetric);

    I.click(this.elements.mainMetricDropdown);
    I.click(this.mainMetricFromDropdown(newMainMetric));
    I.dontSeeElement(this.mainMetricByName(oldMainMetric));
    I.waitForElement(this.mainMetricByName(newMainMetric), 10);
  },

  async verifyMainMetric(mainMetric) {
    I.seeElement(this.mainMetricByName(mainMetric));
  },

  removeMetricFromOverview(metricName) {
    const column = this.getColumnLocator(metricName);

    I.click(column);
    I.waitForElement(this.fields.columnSearchField, 10);
    I.waitForElement(this.elements.removeMetricColumn, 30);
    I.forceClick(this.elements.removeMetricColumn);
    this.waitForOverviewLoaded();
    I.waitForInvisible(this.elements.spinner, 30);
    I.dontSeeElement(this.getQANMetricHeader(metricName));
  },

  addSpecificColumn(columnName) {
    I.click(this.buttons.addColumn);
    const column = `//span[contains(text(), '${columnName}')]`;

    I.waitForVisible(column, 30);
    I.click(column);
  },

  verifyColumnPresent(columnName) {
    const column = `//span[contains(text(), '${columnName}')]`;

    I.seeElement(column);
  },

  showTooltip(rowNumber, dataColumnNumber) {
    const tooltipSelector = this.getCellValueLocator(rowNumber, dataColumnNumber);

    I.waitForElement(tooltipSelector, 30);
    I.scrollTo(tooltipSelector);
    I.moveCursorTo(tooltipSelector);
    I.waitForElement(this.elements.metricTooltip, 30);
  },

  changeSorting(columnNumber) {
    const sortingBlockSelector = this.getMetricSortingLocator(columnNumber);

    I.waitForElement(sortingBlockSelector, 30);
    this.waitForOverviewLoaded();
    I.click(sortingBlockSelector);
  },

  verifySorting(columnNumber, sortDirection) {
    const sortingBlockSelector = this.getMetricSortingLocator(columnNumber);

    I.waitForElement(`${sortingBlockSelector}/span`, 30);
    if (!sortDirection) {
      I.seeAttributesOnElements(`${sortingBlockSelector}/span`, { class: 'sort-by ' });
    } else {
      I.seeAttributesOnElements(`${sortingBlockSelector}/span`, { class: `sort-by ${sortDirection}` });
    }
  },

  async verifyMetricsSorted(metricName, columnNumber, sortOrder = 'down') {
    const rows = await I.grabNumberOfVisibleElements(this.elements.tableRow);

    for (let i = 1; i < rows; i++) {
      let [metricValue] = this.getCellValueLocator(columnNumber, i);
      let [nextMetricValue] = this.getCellValueLocator(columnNumber, i + 1);

      if (metricValue.indexOf('<') > -1) {
        [, metricValue] = metricValue.split('<');
      }

      if (nextMetricValue.indexOf('<') > -1) {
        [, nextMetricValue] = nextMetricValue.split('<');
      }

      if (sortOrder === 'down') {
        assert.ok(metricValue >= nextMetricValue, `Ascending Sort of ${metricName} is wrong`);
      } else {
        assert.ok(metricValue <= nextMetricValue, `Descending Sort of ${metricName} is wrong`);
      }
    }
  },

  async changeGroupBy(groupBy = 'Client Host') {
    const locator = this.getGroupByOptionLocator(groupBy);

    I.waitForElement(this.elements.groupBy, 30);
    I.forceClick(this.elements.groupBy);
    I.waitForVisible(locator, 30);
    I.click(locator);
  },

  verifyGroupByIs(groupBy) {
    I.waitForText(groupBy, 30, this.elements.groupBy);
    I.seeElement(locate(this.elements.groupBy).find(`[title="${groupBy}"]`));
    I.seeTextEquals(groupBy, this.elements.groupBy);
  },

  selectRow(rowNumber) {
    const rowSelector = this.getRowLocator(rowNumber);

    I.waitForElement(rowSelector, 60);
    I.forceClick(rowSelector);
    this.waitForOverviewLoaded();
    I.waitForVisible(this.elements.selectedRow, 10);
  },

  selectRowByText(text) {
    const rowSelector = `//div[@role="row" and descendant::div[text()='${text}']]`;
    // div[@role='row' and descendant::div[text()='select * from test.cities where id = ?']]
    // div[@role="row" and descendant::div[text()='${text}']]

    // I.wait(5000);
    I.waitForElement(rowSelector, 60);
    I.forceClick(rowSelector);
    this.waitForOverviewLoaded();
    I.waitForVisible(this.elements.selectedRow, 10);
  },

  async getQueryFromRow(rowNumber) {
    const rowSelector = this.getRowLocator(rowNumber);

    I.waitForElement(rowSelector, 60);

    return await I.grabTextFrom(locate(rowSelector).find('./div[@role="cell"][2]'));
  },

  selectTotalRow() {
    this.selectRow(0);
  },

  async verifyRowCount(rowCount) {
    I.waitForVisible(this.elements.querySelector, 30);
    const count = await I.grabNumberOfVisibleElements(this.elements.tableRow);

    assert.ok(count === rowCount, `Row count should be ${rowCount} instead of ${count}`);
  },

  async verifyTooltipValue(value) {
    I.waitForText(value, 5, this.elements.tooltipQPSValue);
    const tooltip = await I.grabTextFrom(this.elements.tooltipQPSValue);

    assert.ok(tooltip.includes(value), `The tooltip value is ${tooltip} while expected value was ${value}`);
  },

  mouseOverFirstInfoIcon() {
    I.moveCursorTo(this.elements.firstQueryInfoIcon);
    I.waitForVisible(this.elements.tooltipQueryValue, 30);
  },

  async searchByValue(value, refresh = false) {
    I.waitForVisible(this.fields.searchBy, 30);
    I.clearField(this.fields.searchBy);
    I.fillField(this.fields.searchBy, value);
    I.pressKey('Enter');
  },

  async verifySearchByValue(value) {
    I.seeAttributesOnElements(this.fields.searchBy, { value });
  },
};
