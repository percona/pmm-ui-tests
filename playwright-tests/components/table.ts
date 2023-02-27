import { Page } from '@playwright/test';

export default class Table {
  constructor(readonly page: Page) { }

  private tableElements = {
    body: this.page.getByTestId('table-tbody'),
    row: this.page.getByTestId('table-tbody-tr'),
    rowByText: (text: string) => this.page.locator(`//span[contains(text(),"${text}")]//ancestor::*[@data-testid="table-tbody-tr"]`),
  };

  private tableFields = {

  };

  private tableLabels = {
  };

  private tableButtons = {
  };

  private tableMessages = {

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

}
