import { Page } from '@playwright/test';

export default class OptionsMenu {
  constructor(readonly page: Page) { }

  private selectOptionsMenuContainer = this.page.locator('//*[@aria-label="Select options menu"]')

  elements = {
    optionElement: (option: string) => this.selectOptionsMenuContainer.getByText(option),
  };

  fields = {

  };

  labels = {
  };

  buttons = {
  };

  messages = {

  };

  links = {
  };

  selectOption = async ( option: string ) => {
    await this.elements.optionElement(option).click();
  }

}
