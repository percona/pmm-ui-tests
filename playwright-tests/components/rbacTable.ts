import { expect, Page } from '@playwright/test';
import Table from './table';

export default class RbacTable extends Table {
  constructor(page: Page) {
    super(page);
  }

  private optionsMenu = this.page.getByRole('menu');
  private confirmDeleteRole = this.page.getByRole('dialog');

  elements = {
    ...super.getTableElements(),
    defaultBadge: this.page.getByTestId('role-default-badge'),
    defaultRow: this.page.locator('//*[@data-testid="role-default-badge"]//ancestor::*[@data-testid="table-tbody-tr"]'),
    rowOptions: (text: string) => super.getTableElements().rowByText(text).locator('//*[@aria-label="Open role options"]'),
    setDefault: this.optionsMenu.getByText('Set as default'),
    delete: this.optionsMenu.getByText('Delete'),
    roleAssignedDialogRoleSelect: this.page.locator('//div[contains(@class, "singleValue")]'),
    confirmDeleteRoleHeader: this.confirmDeleteRole.locator('//h2'),
    confirmDeleteRoleBody: this.confirmDeleteRole.locator('//p'),
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
      `There are users associated to this role. By deleting the role “${roleName}“ all its users will be transferred to a new role. Please select the new role below.`,
    deleteRoleHeader: (roleName: string) => `Delete "${roleName}" role`,
    deleteRoleBody: "Are you sure you want to delete this role? You won’t be able to recover it. Please confirm your action below.",
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
