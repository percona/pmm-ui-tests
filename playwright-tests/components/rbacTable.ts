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
    delete: this.optionsMenu.getByText('Delete'),
    roleAssignedDialog: this.page.getByRole('dialog'),
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
    closeDialog: this.page.locator('//*[@aria-label="Close dialogue"]'),
    confirmAndDeleteRole: this.page.getByText('Confirm and delete role'),
  };

  messages = {
    ...super.getTableMessages(),
    userAssigned: (roleName: string) =>
      `There are users associated to this role. Please assign a different role to users with the ”${roleName}” role.`,
    roleDeleted: (roleName: string) => `Role “${roleName}“ deleted`,
  };

  links = {
    ...super.getTableLinks(),
  };

  verifyRowData = async (name: string, description: string, label: string, operator: string, value: string) => {
    await expect(this.elements.rowByText(name)).toContainText(description);
    await expect(this.elements.rowByText(name)).toContainText(`{${label + operator}"${value}"}`);
  };
}
