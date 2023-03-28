import { expect, Page } from '@playwright/test';
import UsersTable from '@tests/components/configuration/usersTable';
import { ConfigurationPage } from './Configuration.page';

export class UsersConfigurationPage extends ConfigurationPage {
  constructor(page: Page) {
    super(page);
  }

  url = 'graph/org/users'
  usersTable = new UsersTable(this.page);

  elements = {
    ...super.getConfigurationElements(),
    usersTable: this.page.locator('//table'),
  };

  fields = {
    ...super.getConfigurationFields(),
    searchUsers: this.page.locator('//input[contains(@placeholder, "Search user")]'),
  };

  labels = {
    ...super.getConfigurationLabels(),

  };

  buttons = {
    ...super.getConfigurationButtons(),
    deleteUser: (userEmail: string) => this.page.locator(`//span[text()="${userEmail}"]//ancestor::tr//button[@aria-label="Delete user"]`),
    confirmDeleteUser: this.page.locator('//button[@aria-label="Confirm Modal Danger Button"]'),
  };

  messages = {
    ...super.getConfigurationMessages(),
  };

  links = {
    ...super.getConfigurationLinks(),
  };

  deleteUser = async (userEmail: string) => {
    await this.buttons.deleteUser(userEmail).click();
    await this.buttons.confirmDeleteUser.click();
  }

  verifyUserNotExists = async (userEmail: string) => {
    await expect(this.elements.usersTable).not.toContainText(userEmail);
  }

}
