import { Page } from '@playwright/test';

export default class PmmMenu {
  constructor(readonly page: Page) { }

  elements = {
    container: this.page.getByRole('menu'),
  };

  fields = {};

  labels = {};

  buttons = {
    menu: this.page.locator('//span[text()="PMM"]//ancestor::button'),
    option: (option: string) => this.page.locator(`//a[contains(@aria-label, "${option}")]`),
  };

  messages = {};

  links = {};

  selectOption = async (option: string) => {
    await this.buttons.menu.click()
    await this.buttons.option(option).click();
  }

}
