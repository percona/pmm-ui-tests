import { Page } from '@playwright/test';

export default class PmmMenu {
  constructor(readonly page: Page) { }

  elements: any = { container: this.page.getByRole('menu') };
  buttons = {
    menu: this.page.locator('//span[text()="PMM"]//ancestor::button'),
    option: (option: string) => this.page.locator(`//a[contains(@aria-label, "${option}")]`),
  };

  selectOption = async (option: string) => {
    await this.buttons.menu.click();
    await this.buttons.option(option).click();
  };
}
