const assert = require('assert');

const { I, qanOverview } = inject();

module.exports = {
  root: '$qan-pagination',
  buttons: {
    lastPageNumber: locate('//li[contains(@class,"ant-pagination-item")]').last(),
    previousPage: '.ant-pagination-prev',
    nextPage: '.ant-pagination-next',
    ellipsis: '.ant-pagination-item-ellipsis',
  },
  elements: {
    resultsPerPage: '.ant-pagination-options',
  },

  getActivePageLocator: (number) => `//li[@class='ant-pagination-item ant-pagination-item-${number} ant-pagination-item-active']`,

  getPageLocator: (number) => `//li[@class='ant-pagination-item ant-pagination-item-${number}']`,

  getPerPageOptionLocator: (option) => locate('[role="listbox"]').find('li').withText(option),

  async getLastPageNumber() {
    return await I.grabAttributeFrom(this.buttons.lastPageNumber, 'title');
  },

  selectPage(page) {
    I.click(this.getPageLocator(page));
  },

  async selectResultsPerPage(option) {
    const optionToSelect = this.getPerPageOptionLocator(option);
    const pageCount = await this.getLastPageNumber();

    I.click(this.elements.resultsPerPage);
    I.click(optionToSelect);

    // 20 sec wait for pages count to change
    for (let i = 0; i < 10; i++) {
      const newPageCount = await this.getLastPageNumber();

      if (newPageCount !== pageCount) {
        return;
      }

      I.wait(2);
    }
  },

  async verifySelectedCountPerPage(expectedResults) {
    I.waitForElement(this.elements.resultsPerPage, 30);
    await within(this.elements.resultsPerPage, () => {
      I.see(expectedResults);
    });
  },

  verifyActivePage(page) {
    const item = this.getActivePageLocator(page);

    I.waitForElement(item, 30);
  },

  async verifyPagesAndCount(itemsPerPage) {
    const count = await qanOverview.getCountOfItems();
    const lastPage = await this.getLastPageNumber();
    const result = count / lastPage;

    assert.ok((Math.ceil(result / 25) * 25) === itemsPerPage, 'Pages do not match with total count');
  },

  async verifyRange(expectedRange) {
    const count = await I.grabTextFrom(qanOverview.elements.countOfItems);

    assert.equal(count.includes(expectedRange), true, `The value ${expectedRange} should include ${count}`);
  },
};
