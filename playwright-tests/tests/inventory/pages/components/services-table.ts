import { expect } from '@playwright/test';
import Table from '@components/table';
import AgentsTable from './agents-table';

export interface ServiceDetails {
  serviceName: string;
  nodeName: string;
  monitoring: 'OK';
  address: string;
  port: string;
}

export default class ServicesTable extends Table {
  private dropdownMenu = this.page.locator('//div[@data-testid="dropdown-menu-menu"]');

  elements: any = {
    ...this.elements,
    serviceName: (serviceName: string) => this.elements.rowByText(serviceName).locator('td').nth(2),
    nodeName: (serviceName: string) => this.elements.rowByText(serviceName).locator('td').nth(3),
    monitoring: (serviceName: string) => this.elements.rowByText(serviceName).locator('td').nth(4)
      .locator('//a'),
    address: (serviceName: string) => this.elements.rowByText(serviceName).locator('td').nth(5),
    port: (serviceName: string) => this.elements.rowByText(serviceName).locator('td').nth(6),
    serviceStatuses: this.elements.row.locator('//td[5]'),
    agentStatus: this.page.locator('//span[@data-testid="details-row-content"]//div[contains(@data-testid, "status-badge")]'),
    rowMonitoring: this.elements.row.locator('//td[5]').locator('//a'),
  };

  buttons: any = {
    ...this.buttons,
    options: (serviceName: string) => this.buttons.rowByText(serviceName).locator('//button[@data-testid="dropdown-menu-toggle"]'),
    deleteService: this.dropdownMenu.locator('//span[text()="Delete"]'),
    serviceDashboard: this.dropdownMenu.locator('//span[text()="Dashboard"]'),
    qan: this.dropdownMenu.locator('//span[text()="QAN"]'),
    showRowDetails: (serviceName: string) => this.buttons.rowByText(serviceName).getByTestId('show-row-details'),
    hideRowDetails: (serviceName: string) => this.buttons.rowByText(serviceName).getByTestId('hide-row-details'),
    showDetails: this.page.getByTestId('show-row-details'),
    selectService: (serviceName: string) => this.buttons.rowByText(serviceName).locator('//input[contains(@id, "input-table-select")]'),
  };

  messages: any = {
    ...this.messages,
    successfullyDeleted: (number: number) => `${number} of ${number} services successfully deleted`,
  };

  verifyService = async (details: ServiceDetails) => {
    await expect(this.elements.serviceName(details.serviceName)).toContainText(details.serviceName);
    await expect(this.elements.monitoring(details.serviceName)).toContainText(details.monitoring);
    await expect(this.elements.address(details.serviceName)).toContainText(details.address);
    await expect(this.elements.port(details.serviceName)).toContainText(details.port);
  };

  verifyAllMonitoring = async (expectedStatus: string) => {
    const numberOfServices = await this.elements.serviceStatuses.count();

    for (let i = 0; i < numberOfServices; i++) {
      await expect(this.elements.serviceStatuses.nth(i)).toHaveText(expectedStatus);
    }
  };

  verifyAllServicesAgentsLabelsExcept = async (labelName: string, agentsException: string[]) => {
    await this.elements.row.nth(0).waitFor({
      state: 'visible',
    });
    const services = await this.elements.row.count();
    const agentsTable = new AgentsTable(this.page);

    for (let index = 0; index < services; index++) {
      await this.elements.rowMonitoring.nth(index).waitFor({
        state: 'visible',
      });
      await this.elements.rowMonitoring.nth(index).click();
      await agentsTable.verifyAgentLabelVisibleForAgentsExcept(labelName, agentsException);
      await agentsTable.buttons.goBackToServices.click();
    }
  };
}
