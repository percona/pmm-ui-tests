const { I } = inject();

/**
 * Pagination section of PMM Inventory page
 */
module.exports = {
  wrapperDiv: '$pagination',
  rowsPerPageDropdown: locate('span').withChild('span').withText('Rows per page: '),
  totalsLabel: '$pagination-items-inverval',
  firstPageButton: '$first-page-button',
  previousPageButton: '$previous-page-button',
  pageNumberButtonLast: locate('$page-button').last(),
  nextPageButton: '$next-page-button',
  lastPageButton: '$last-page-button',

  getPageLocator: (number) => locate('$page-button').withText(`${number}`),

  getPerPageOptionLocator: (option) => locate('[role="listbox"]').find('li').withText(option),

  /**
   * Check that selected value in "Rows per page" dropdown matches expected
   *
   * @param     expectedNumber    number to check, possible values: 25|50|100
   * @returns   {Promise<void>}
   */
  async verifySelectedCountPerPage(expectedNumber) {
    I.assertContain([25, 50, 100], expectedNumber,
      'Expected number is not the one available options to select in dropdown');
    I.waitForElement(this.rowsPerPageDropdown, 30);
    await within(this.rowsPerPageDropdown, () => {
      I.see(expectedNumber);
    });
  },

  async selectRowsPerPage(option) {
    I.assertContain([25, 50, 100], option,
      'Specified option is not the one available options to select in dropdown');

    const optionLocator = this.getPerPageOptionLocator(option);
    const pagesCount = await this.getLastPageNumber();
    const rowsTotal = await this.getTotalOfItems();
    const rowsShowing = await this.getLastPageNumber();

    I.click(this.rowsPerPageDropdown);
    I.click(optionLocator);

    if (rowsShowing !== rowsTotal && rowsTotal < option ) {
      // 20 sec wait for pages count to change
      await I.asyncWaitFor(async () => {
        const newPagesCount = await this.getLastPageNumber();

        return newPagesCount !== pagesCount;
      }, 20);
    } else {
      I.wait(2);
    }
  },

  async getTotalOfItems() {
    I.waitForVisible(this.totalsLabel, 30);
    const resultsCount = (await I.grabTextFrom(this.totalsLabel)).split(' ');

    return resultsCount[3];
  },

  async getLastPageNumber() {
    return await I.grabTextFrom(this.pageNumberButtonLast);
  },

  /* The check is bogus now, see the comment inside */
  verifyActivePageIs(page) {
    const item = this.getPageLocator(page);

    // FIXME: add proper check when PMM-10803 will be fixed
    I.waitForElement(item, 30);
  },

  async verifyPagesAndCount(itemsPerPage) {
    const count = await this.getCountOfItems();
    const lastPage = await this.getLastPageNumber();
    const result = count / lastPage;

    I.assertEqual((Math.ceil(result / 25) * 25), itemsPerPage, 'Pages do not match with total count');
  },

  async verifyRange(expectedRange) {
    const count = await I.grabTextFrom(this.totalsLabel);

    I.assertEqual(count.includes(expectedRange), true, `The value ${expectedRange} should include ${count}`);
  },
};
