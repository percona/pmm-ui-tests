import { expect, Page } from '@playwright/test';
import Table from '../table';

export interface ServiceDetails {
  serviceName: string;
  nodeName: string;
  monitoring: 'OK';
  address: string;
  port: string;
}

export default class ServicesTable extends Table {
  constructor(page: Page) {
    super(page);
  }

  private dropdownMenu = this.page.locator('//div[@data-testid="dropdown-menu-menu"]');

  elements = {
    ...super.getTableElements(),
    serviceName: (serviceName: string) => super.getTableElements().rowByText(serviceName).locator('td').nth(1),
    nodeName: (nodeName: string) => super.getTableElements().rowByText(nodeName).locator('td').nth(2),
    monitoring: (status: string) => super.getTableElements().rowByText(status).locator('td').nth(3),
    address: (address: string) => super.getTableElements().rowByText(address).locator('td').nth(4),
    port: (address: string) => super.getTableElements().rowByText(address).locator('td').nth(5),
  };

  fields = {
    ...super.getTableFields(),
  };

  labels = {
    ...super.getTableLabels(),
  };

  buttons = {
    ...super.getTableButtons(),
    options: (serviceName: string) => super.getTableElements().rowByText(serviceName).locator('//button[@data-testid="dropdown-menu-toggle"]'),
    deleteService: this.dropdownMenu.locator('//span[text()="Delete"]'),
    serviceDashboard: this.dropdownMenu.locator('//span[text()="Dashboard"]'),
    qan: this.dropdownMenu.locator('//span[text()="QAN"]'),
    showRowDetails: (serviceName: string) => super.getTableElements().rowByText(serviceName).getByTestId('show-row-details'),
    hideRowDetails: (serviceName: string) => super.getTableElements().rowByText(serviceName).getByTestId('hide-row-details')
  };

  messages = {
    ...super.getTableMessages(),
  };

  links = {
    ...super.getTableLinks(),
  };

  verifyService = async (details: ServiceDetails) => {
    await expect(this.elements.serviceName(details.serviceName)).toContainText(details.serviceName);
    await expect(this.elements.monitoring(details.serviceName)).toContainText(details.monitoring);
    await expect(this.elements.address(details.serviceName)).toContainText(details.address);
    await expect(this.elements.port(details.serviceName)).toContainText(details.port);
  };
}
