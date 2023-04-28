import { Page } from '@playwright/test';
import Table from '../table';

export default class FailedChecksTable extends Table {
  constructor(page: Page) {
    super(page);
  }

  elements = {
    ...super.getTableElements(),
    serviceName: (checkName: string) => this.page.locator(`//td[@title="${checkName}"]//ancestor::tr/following-sibling::tr//div[@data-testid="chip" and contains(text(), 'service_name')]`),
    showDetails: (checkName: string) => this.page.locator(`//td[@title="${checkName}"]`).getByTestId('show-details'),
  };

  fields = {
    ...super.getTableFields(),
  };

  labels = {
    ...super.getTableLabels(),
  };

  buttons = {
    ...super.getTableButtons(),
  };

  messages = {
    ...super.getTableMessages(),
  };

  links = {
    ...super.getTableLinks(),
  };
}
