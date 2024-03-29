import { Page } from '@playwright/test';
import OptionsMenu from '@components/options-menu';

export default class UsersTable {
  constructor(readonly page: Page) {}

  private optionMenu = new OptionsMenu(this.page);

  elements: any = {
    rowByText: (text: string) => this.page.locator(`//span[contains(text(),"${text}")]//ancestor::tr`),
  };

  fields = {
    accessRole: (username: string) => this.elements.rowByText(username).locator('//*[@aria-label="Access Roles"]'),
    assignRole: (roleName: string) => this.page.locator(`//*[contains(@data-testid, "${roleName}-select-option")]`),
    removeRole: (username: string, roleName: string) =>
      this.elements.rowByText(username).locator(`//*[@aria-label="Remove ${roleName}"]`),
  };
}
