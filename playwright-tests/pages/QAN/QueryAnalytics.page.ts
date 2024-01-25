import { CommonPage } from '@pages/common.page';

export class QanPage extends CommonPage {
  buttons = {
    serviceNameCheckbox: (serviceName: string) => this.page.locator(`//input[contains(@name, "service_name;${serviceName}")]`),
  };
}
