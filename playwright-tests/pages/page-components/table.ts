import { expect, Page } from '@playwright/test';

export default class Table {
  constructor(readonly page: Page) { }

  private pagination = this.page.getByTestId('pagination');
  private tableBody = this.page.getByTestId('table-tbody');

  elements: any = {
    body: this.page.getByTestId('table-tbody'),
    row: this.tableBody.getByTestId('table-tbody-tr'),
    rowByText: (text: string) => this.page.locator(`//*[contains(text(),"${text}")]//ancestor::*[@data-testid="table-tbody-tr"]`),
    pagination: this.pagination,
    paginationInterval: this.pagination.getByTestId('pagination-items-inverval'),
  };

  buttons: any = {
    firstPage: this.elements.pagination.getByTestId('first-page-button'),
    previousPage: this.elements.pagination.getByTestId('previous-page-button'),
    activePage: this.elements.pagination.getByTestId('page-button-active'),
    nextPage: this.elements.pagination.getByTestId('next-page-button'),
    lastPage: this.elements.pagination.getByTestId('last-page-button'),
    page: this.elements.pagination.locator('//button[@data-testid="page-button" or @data-testid="page-button-active"]'),
  };

  messages: any = {
    paginationInterval: (start: number, end: number) => `Showing ${start}-${end} of ${end} items`,
  };

  verifyTableDoesNotContain = async (text: string) => {
    await this.elements.row.first().waitFor({ state: 'visible' });
    await expect(this.elements.body).not.toContainText(text);
  };

  verifyPagination = async (numberOfElements: number) => {
    await this.buttons.firstPage.waitFor({ state: 'visible' });
    await this.buttons.previousPage.waitFor({ state: 'visible' });
    await this.elements.page.waitFor({ state: 'visible' });
    await this.elements.nextPage.waitFor({ state: 'visible' });
    await this.elements.lastPage.waitFor({ state: 'visible' });
    await expect(this.elements.paginationInterval)
      .toHaveText(this.messages.paginationInterval(1, numberOfElements) as string);
  };
}
