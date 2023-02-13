import { expect, Page } from '@playwright/test';
import Table from './table';

export default class RbacTable extends Table {
  constructor(page: Page) { 
    super(page);
  }

  private optionsMenu = this.page.getByRole('menu');

  elements = {
    ...super.getTableElements(),
    defaultBadge: this.page.getByTestId('role-default-badge'),
    defaultRow: this.page.locator('//*[@data-testid="role-default-badge"]//ancestor::*[@data-testid="table-tbody-tr"]'),
    rowOptions: (text: string) => super.getTableElements().rowByText(text).locator('//*[@aria-label="Open role options"]'),
    setDefault: this.optionsMenu.getByText('Set as default'),
  };

  fields = {
    ...super.getTableFields(),
  };

  labels = {
    ...super.getTableLabels(),
    fullAccess: 'Full access',
  };

  buttons = {
    ...super.getTableButtons(),
  };

  messages = {
    ...super.getTableMessages(),
  };

  links = {
    ...super.getTableLinks(),
  };

  verifyRowData = async (name:string, description:string, label: string, operator: string, value:string) => {
    await expect(this.elements.rowByText(name)).toContainText(description);
    await expect(this.elements.rowByText(name)).toContainText(`{${label + operator}"${value}"}`);
  }

}
