import { ElementHandle, expect, Page } from '@playwright/test';
import Table from '../../../components/table';

export default class AgentsTable extends Table {
  constructor(page: Page) {
    super(page);
  }

  private dropdownMenu = this.page.locator('//div[@data-testid="dropdown-menu-menu"]');

  elements = {
    ...super.getTableElements(),
    checkbox: (serviceName: string) => super.getTableElements().rowByText(serviceName).locator('td').nth(0).locator('//input[contains(@data-testid, "checkbox-input")]'),
    status: (serviceName: string) => super.getTableElements().rowByText(serviceName).locator('td').nth(1),
    agentType: (serviceName: string) => super.getTableElements().rowByText(serviceName).locator('td').nth(2),
    agentId: (serviceName: string) => super.getTableElements().rowByText(serviceName).locator('td').nth(3),
    statuses: super.getTableElements().row.locator('//td[2]'),
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
    delete: this.page.getByText('Delete'),
    showRowDetails: (serviceName: string) => super.getTableElements().rowByText(serviceName).getByTestId('show-row-details'),
    hideRowDetails: (serviceName: string) => super.getTableElements().rowByText(serviceName).getByTestId('hide-row-details'),
    proceed: this.page.getByText('Proceed'),
  };

  messages = {
    ...super.getTableMessages(),
    successfullyDeleted: (number: number) => `${number} of ${number} agents successfully deleted`,
    noAgents: 'No agents available',
  };

  links = {
    ...super.getTableLinks(),
  };

  verifyAllAgentsStatus = async (expectedStatus: string) => {
    await this.elements.statuses.first().waitFor({ state: 'visible' });
    const agents: ElementHandle[] = await this.elements.statuses.elementHandles();
    for await (const [_, agent] of agents.entries()) {
      expect(await agent.textContent()).toEqual(expectedStatus);
    }
  }
}
