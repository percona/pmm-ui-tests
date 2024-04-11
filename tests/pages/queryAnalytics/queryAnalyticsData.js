const assert = require('assert');

const { I, queryAnalyticsPage } = inject();

class QueryAnalyticsData {
  constructor() {
    this.elements = {
      queryRow: (rowNumber) => locate(`//div[@role="row" and contains(@class, "tr-${rowNumber}")]`),
      queryRows: locate('//div[@role="row" and contains(@class, "tr-")]'),
      totalItems: I.useDataQA('qan-total-items'),
    };
    this.buttons = {
      lastPage: locate('//li[contains(@class,"ant-pagination-item")]').last(),
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
}

module.exports = new QueryAnalyticsData();
module.exports.QueryAnalyticsData = QueryAnalyticsData;
