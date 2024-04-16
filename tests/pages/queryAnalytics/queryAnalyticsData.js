const assert = require('assert');

const { I, queryAnalyticsPage } = inject();

class QueryAnalyticsData {
  constructor() {
    this.elements = {
      queryRow: (rowNumber) => locate(`//div[@role="row" and contains(@class, "tr-${rowNumber}")]`),
      queryRows: locate('//div[@role="row" and contains(@class, "tr-")]'),
      totalItems: I.useDataQA('qan-total-items'),
      selectedRow: locate('.selected-overview-row'),
      metricsCellDetailValue: (metricName, columnNumber) => locate(`//td//span[contains(text(), "${metricName}")]/ancestor::tr/td[${columnNumber}]//span[1]`),
      queryValue: (rowNumber, columnNumber) => `div.tr-${rowNumber} > div:nth-child(${columnNumber + 2}) span > div > span`,
      noClassic: '//pre[contains(text(), "No classic explain found")]',
      noJSON: '//pre[contains(text(), "No JSON explain found")]',
      columnHeaderText: (headerText) => locate(`//span[@class="ant-select-selection-item" and text()="${headerText}"]`),
      sorting: (columnNumber) => locate(`(//a[@data-testid='sort-by-control'])[${columnNumber}]`),
      sortingValue: (columnNumber) => this.elements.sorting(columnNumber).find('//span'),
    };
    this.fields = {
      searchBy: '//input[contains(@name, "search")]',
    };
    this.buttons = {
      lastPage: locate('//li[contains(@class,"ant-pagination-item")]').last(),
      previousPage: locate('.ant-pagination-prev'),
      nextPage: locate('.ant-pagination-next'),
      ellipsis: locate('.ant-pagination-item-ellipsis'),
      detailsTab: (tabName) => locate('button').withText(tabName),
    };
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

  waitForDetails() {
    I.waitForVisible(this.buttons.detailsTab('Details'), 30);
    I.click(this.buttons.detailsTab('Details'));
    I.wait(5);
    queryAnalyticsPage.waitForLoaded();
    I.dontSeeElement(this.elements.noClassic);
    I.dontSeeElement(this.elements.noJSON);
  }

  selectTotalRow() {
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
    I.seeAttributesOnElements(this.elements.sortingValue(columnNumber), { class: `sort-by ${sortDirection}` });
  }
}

module.exports = new QueryAnalyticsData();
module.exports.QueryAnalyticsData = QueryAnalyticsData;
