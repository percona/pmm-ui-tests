import {expect, Locator} from '@playwright/test';
import UsersTable from '@components/configuration/users-table';
import { CommonPage } from '@pages/common.page';

export class UsersConfigurationPage extends CommonPage {
  url = 'graph/org/users';
  usersTable = new UsersTable(this.page);

  elements: any = {
    ...this.elements,
    usersTable: this.page.locator('//table'),
    searchUserInput: this.page.locator('//input[contains(@placeholder, "Search user")]'),
    deleteUserButton: (userEmail: string) => this.page.locator(`//span[text()="${userEmail}"]//ancestor::tr//button[@aria-label="Delete user"]`),
    // TODO: extract to ConfirmationModal
    confirmDeleteUserButton: this.page.locator('//button[@aria-label="Confirm Modal Danger Button"]'),
  };

  deleteUser = async (userEmail: string) => {
    await this.elements.deleteUserButton(userEmail).click();
    await this.elements.confirmDeleteUserButton.click();
  };

  verifyUserNotExists = async (userEmail: string) => {
    await expect(this.elements.usersTable).not.toContainText(userEmail);
  };
}
