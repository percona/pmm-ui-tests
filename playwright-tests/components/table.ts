import { expect, Page } from '@playwright/test';

export default class Table {
  constructor(readonly page: Page) { }

  private pagination = this.page.getByTestId('pagination');

  private tableElements = {
    body: this.page.getByTestId('table-tbody'),
    row: this.page.getByTestId('table-tbody-tr'),
    rowByText: (text: string) => this.page.locator(`//*[contains(text(),"${text}")]//ancestor::*[@data-testid="table-tbody-tr"]`),
    pagination: this.pagination,
    paginationInterval: this.pagination.getByTestId('pagination-items-inverval'),
  };

  private tableFields = {

  };

  private tableLabels = {
  };

  private tableButtons = {
    firstPage: this.tableElements.pagination.getByTestId('first-page-button'),
    previousPage: this.tableElements.pagination.getByTestId('previous-page-button'),
    activePage: this.tableElements.pagination.getByTestId('page-button-active'),
    nextPage: this.tableElements.pagination.getByTestId('next-page-button'),
    lastPage: this.tableElements.pagination.getByTestId('last-page-button'),
    page: this.tableElements.pagination.locator('//button[@data-testid="page-button" or @data-testid="page-button-active"]'),

  };

  private tableMessages = {
    paginationInterval: (start: number, end: number) => `Showing ${start}-${end} of ${end} items`
  };

  private tableLinks = {
  };

  protected getTableElements() {
    return this.tableElements;
  }

  protected getTableFields() {
    return this.tableFields;
  }

  protected getTableLabels() {
    return this.tableLabels;
  }

  protected getTableButtons() {
    return this.tableButtons;
  }

  protected getTableMessages() {
    return this.tableMessages;
  }

  protected getTableLinks() {
    return this.tableLinks;
  }

  verifyTableDoesNotContain = async (text: string) => {
    try {
      await this.tableElements.row.waitFor({ state: 'visible' });
    } catch (e) {
      // fails if multiple rows displayed
    }
    await expect(this.tableElements.body).not.toContainText(text);
  }

  verifyPagination = async (numberOfElements: number) => {
    await this.tableButtons.firstPage.waitFor({ state: 'visible' });
    await this.tableButtons.previousPage.waitFor({ state: 'visible' });
    await this.tableButtons.page.waitFor({ state: 'visible' });
    await this.tableButtons.nextPage.waitFor({ state: 'visible' });
    await this.tableButtons.lastPage.waitFor({ state: 'visible' });
    await expect(this.tableElements.paginationInterval).toHaveText(this.tableMessages.paginationInterval(1, numberOfElements));
  }

}
