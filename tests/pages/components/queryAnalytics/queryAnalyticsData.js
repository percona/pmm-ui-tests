const assert = require('assert');

const { I, queryAnalyticsPage } = inject();

class QueryAnalyticsData {
  constructor() {
    this.root = locate('.query-analytics-data');
    this.elements = {
      queryRow: (rowNumber) => locate(`//div[@role="row" and contains(@class, "tr-${rowNumber}")]`),
      queryRows: locate('//div[@role="row" and contains(@class, "tr-")]'),
      queryRowValue: (rowNumber) => locate(`div.tr-${rowNumber} > div.td:nth-child(2) div > div`),
      queryRowIcon: (rowNumber) => locate(`div.tr-${rowNumber} > div.td:nth-child(2) div > svg`),
      totalItems: I.useDataQA('qan-total-items'),
      selectedRow: locate('.selected-overview-row'),
      queryValue: (rowNumber, columnNumber) => `div.tr-${rowNumber} > div:nth-child(${columnNumber + 2}) span > div > span`,
      columnHeaderText: (headerText) => locate(`//span[@class="ant-select-selection-item" and text()="${headerText}"]`),
      sorting: (columnNumber) => locate(`(//a[@data-testid='sort-by-control'])[${columnNumber}]`),
      sortingValue: (columnNumber) => this.elements.sorting(columnNumber).find('//span'),
      queryTooltipValue: locate('.ant-tooltip-inner').find('code'),
      queryTooltipId: locate('.ant-tooltip-inner').find('h5'),
      latencyChart: locate('.latency-chart-container'),
      metricTooltip: locate('.ant-tooltip-content'),
      metricInDropdown: (name) => locate('[role="listbox"]').find(`[label='${name}']`),
      addColumnNoDataIcon: 'div.ant-empty-image',
      tooltipQPSValue: '$qps',
      tooltip: '.overview-column-tooltip',
      noResultTableText: locate('$table-no-data').find('h1'),
      selectedRowByNumber: (rowNumber) => locate(`div.tr-${rowNumber}.selected-overview-row`),
      selectedMainMetric: () => this.elements.mainMetricsContainer.find('//span[@class="ant-select-selection-item"]'),
      mainMetricsContainer: locate('//div[@data-testid="group-by"]'),
      mainMetricFromDropdown: (metricName) => locate(`//div[@class="ant-select-item-option-content" and text()="${metricName}"]`),
      mainMetricByName: (metricsName) => this.elements.selectedMainMetric().withText(metricsName),
    };
    this.fields = {
      searchBy: '//input[contains(@name, "search")]',
      columnHeader: (columnName) => locate('$manage-columns-selector').withText(columnName),
    };
    this.buttons = {
      lastPage: locate('//li[contains(@class,"ant-pagination-item")]').last(),
      previousPage: locate('.ant-pagination-prev'),
      nextPage: locate('.ant-pagination-next'),
      activePage: locate('//li[contains(@class, "ant-pagination-item-active")]'),
      ellipsis: locate('.ant-pagination-item-ellipsis'),
      paginationPage: (number) => `//li[@class='ant-pagination-item ant-pagination-item-${number}']`,
      paginationSize: locate('//div[@aria-label="Page Size"]//span[@class="ant-select-selection-item"]'),
      paginationOption: (paginationSize) => locate(`//div[@role="option" and @title="${paginationSize}"]`),
      close: locate('button').find('span').withText('Close'),
    };
    this.labels = {
      detailsHeaders: ['Details', 'Example', 'Explain', 'Tables'],
    };
    this.messages = {
      noResultTableText: 'No queries available for this combination of filters in the selected time frame',
    };
  }

  async changeMainMetric(newMainMetric) {
    const oldMainMetric = await I.grabTextFrom(this.elements.selectedMainMetric());

    I.click(this.elements.mainMetricsContainer);
    I.click(this.elements.mainMetricFromDropdown(newMainMetric));
    I.waitForDetached(this.elements.mainMetricByName(oldMainMetric), 10);
    I.waitForElement(this.elements.mainMetricByName(newMainMetric), 10);
  }

  verifyMainMetric(mainMetric) {
    I.waitForVisible(this.elements.mainMetricByName(mainMetric));
  }

  selectRow(rowNumber) {
    I.waitForElement(this.elements.queryRow(rowNumber), 60);
    I.forceClick(this.elements.queryRow(rowNumber));
    queryAnalyticsPage.waitForLoaded();
    I.waitForVisible(this.elements.selectedRow, 10);
  }

  async verifyRowCount(expectedRowCount) {
    I.waitForVisible(this.elements.queryRows, 30);
    const count = await I.grabNumberOfVisibleElements(this.elements.queryRows);

    assert.ok(count === expectedRowCount, `Row count should be ${expectedRowCount} instead of ${count}`);
  }

  async getRowCount(rowCount) {
    I.waitForVisible(this.elements.queryRows, 30);

    return await I.grabNumberOfVisibleElements(this.elements.queryRows);
  }

  async verifyPagesAndCount(itemsPerPage) {
    const count = await this.getTotalOfItems();
    const lastPage = await this.getLastPageNumber();
    const result = count / lastPage;

    I.assertEqual((Math.ceil(result / 25) * 25), itemsPerPage, 'Pages do not match with total count');
  }

  async getTotalOfItems() {
    I.waitForVisible(this.elements.totalItems, 30);

    return (await I.grabTextFrom(this.elements.totalItems)).split(' ')[2];
  }

  async getLastPageNumber() {
    return await I.grabAttributeFrom(this.buttons.lastPage, 'title');
  }

  searchByValue(value, refresh = false) {
    I.waitForVisible(this.fields.searchBy, 30);
    I.clearField(this.fields.searchBy);
    I.fillField(this.fields.searchBy, value);
    I.pressKey('Enter');
  }

  async getCountOfItems() {
    I.waitForVisible(this.elements.queryRow(1), 30);
    const resultsCount = (await I.grabTextFrom(this.elements.totalItems)).split(' ');

    return resultsCount[2];
  }

  selectTotalRow() {
    I.waitForVisible(this.elements.queryRow(0));
    I.click(this.elements.queryRow(0));
  }

  verifyColumnPresent(headerText) {
    I.waitForVisible(this.elements.columnHeaderText(headerText));
  }

  async verifySearchByValue(value) {
    I.seeAttributesOnElements(this.fields.searchBy, { value });
  }

  verifySorting(columnNumber, sortDirection) {
    I.waitForElement(this.elements.sortingValue(columnNumber), 30);
    if (sortDirection) {
      I.seeAttributesOnElements(this.elements.sortingValue(columnNumber), { class: `sort-by ${sortDirection}` });
    } else {
      I.seeAttributesOnElements(this.elements.sortingValue(columnNumber), { class: 'sort-by ' });
    }
  }

  waitForNewItemsCount(originalCount) {
    for (let i = 0; i < 5; i++) {
      I.wait(1);
      const count = this.getCountOfItems();

      if (count !== originalCount) {
        return count;
      }
    }

    return false;
  }

  mouseOverInfoIcon(rowNumber) {
    I.moveCursorTo(this.elements.queryRowIcon(rowNumber));
    I.waitForVisible(this.elements.queryTooltipValue, 30);
  }

  showTooltip(rowNumber, dataColumnNumber) {
    I.waitForElement(this.elements.queryValue(rowNumber, dataColumnNumber), 30);
    I.scrollTo(this.elements.queryValue(rowNumber, dataColumnNumber));
    I.moveCursorTo(this.elements.queryValue(rowNumber, dataColumnNumber));
    I.waitForElement(this.elements.metricTooltip, 30);
  }

  changeMetric(columnName, metricName) {
    const newMetric = this.fields.columnHeader(metricName);
    const metricInDropdown = this.elements.metricInDropdown(metricName);
    const oldMetric = this.fields.columnHeader(columnName);

    I.waitForElement(oldMetric, 30);
    queryAnalyticsPage.waitForLoaded();

    // Hardcoded wait because of random failings
    I.wait(3);
    I.click(oldMetric);
    queryAnalyticsPage.waitForLoaded();
    I.click(metricInDropdown);
    I.waitForElement(newMetric, 30);
    I.seeElement(newMetric);
    I.dontSeeElement(oldMetric);
  }

  async verifyMetricsSorted(metricName, columnNumber, sortOrder = 'down') {
    I.waitForVisible(this.elements.queryRows);
    const rows = await I.grabNumberOfVisibleElements(this.elements.queryRows);

    for (let i = 1; i < rows; i++) {
      let [metricValue] = this.elements.queryValue(columnNumber, i);
      let [nextMetricValue] = this.elements.queryValue(columnNumber, i + 1);

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
  }

  async verifyTooltipValue(value) {
    I.waitForText(value, 5, this.elements.tooltipQPSValue);
    const tooltip = await I.grabTextFrom(this.elements.tooltipQPSValue);

    assert.ok(tooltip.includes(value), `The tooltip value is ${tooltip} while expected value was ${value}`);
  }

  async verifyActivePage(expectedActivePage) {
    I.waitForVisible(this.buttons.activePage);
    const activePage = await I.grabTextFrom(this.buttons.activePage);

    assert.ok(String(activePage) === String(expectedActivePage), `Expected Active page: "${expectedActivePage}" does not equal active page: "${activePage}"`);
  }

  async verifyPaginationRange(expectedRange) {
    const count = await I.grabTextFrom(this.elements.totalItems);

    I.assertEqual(count.includes(expectedRange), true, `The value ${expectedRange} should include ${count}`);
  }

  async verifySelectedCountPerPage(expectedNumber) {
    I.assertContain(
      [25, 50, 100],
      Number(expectedNumber.match(/\d+/)),
      'Expected number is not the one available options to select in dropdown',
    );
    I.waitForElement(this.buttons.paginationSize, 30);
    const paginationSize = await I.grabTextFrom(this.buttons.paginationSize);

    I.assertEqual(paginationSize.includes(expectedNumber), true, `The pagination size: ${paginationSize} should include ${expectedNumber}`);
  }

  async selectResultsPerPage(option) {
    const optionToSelect = this.buttons.paginationOption(option);
    const pageCount = await this.getLastPageNumber();

    I.click(this.buttons.paginationSize);
    I.click(optionToSelect);

    // Max 20 sec wait for pages count to change
    for (let i = 0; i < 10; i++) {
      const newPageCount = await this.getLastPageNumber();

      if (newPageCount !== pageCount) {
        return;
      }

      I.wait(2);
    }
  }

  async getTooltipQueryId() {
    const rawText = (await I.grabTextFrom(this.elements.queryTooltipId)).split(':');

    return rawText[1].trim();
  }

  async hideTooltip() {
    await I.moveCursorTo(queryAnalyticsPage.buttons.addColumnButton);
    await I.waitForInvisible(this.elements.metricTooltip, 5);
  }
}

module.exports = new QueryAnalyticsData();
module.exports.QueryAnalyticsData = QueryAnalyticsData;
