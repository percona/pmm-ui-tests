import { expect, Page } from '@playwright/test';
import OptionsMenu from '../optionsMenu';

export default class UsersTable {
  constructor(readonly page: Page) { }

  private optionMenu = new OptionsMenu(this.page);

  elements = {
    rowByText: (text: string) => this.page.locator(`//span[contains(text(),"${text}")]//ancestor::tr`),
  };

  fields = {
    accessRole: (username: string) => this.elements.rowByText(username).locator('//*[@aria-label="Access Roles"]'),
  };

  labels = {
  };

  buttons = {
  };

  messages = {
  };

  links = {
  };
}
