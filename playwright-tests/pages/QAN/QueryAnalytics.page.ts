
import { Page } from '@playwright/test';
import { CommonPage } from '../Common.page';

export class QAN extends CommonPage {
  constructor(page: Page) {
    super(page);
  }

  elements = {
    ...super.getElements(),
  };

  fields = {
    ...super.getFields(),
  };

  labels = {
    ...super.getLabels(),
  };

  buttons = {
    ...super.getButtons(),
    serviceNameCheckbox: (serviceName: string) => this.page.locator(`//input[contains(@name, "service_name;${serviceName}")]`),
  };

  messages = {
    ...super.getMessages(),
  };

  links = {
    ...super.getLinks(),
  };
}
