import { ElementHandle, expect } from '@playwright/test';
import Table from '@components/table';

export default class AgentsTable extends Table {
  private dropdownMenu = this.page.locator('//div[@data-testid="dropdown-menu-menu"]');

  elements: any = {
    ...this.elements,
    agentsRow: this.page.getByTestId('table-tbody').getByRole('row'),
    checkbox: (serviceName: string) => this.elements.rowByText(serviceName).locator('td').nth(0)
      .locator('//input[contains(@data-testid, "checkbox-input")]'),
    status: (serviceName: string) => this.elements.rowByText(serviceName).locator('td').nth(1),
    agentType: (serviceName: string) => this.elements.rowByText(serviceName).locator('td').nth(2),
    agentId: (serviceName: string) => this.elements.rowByText(serviceName).locator('td').nth(3),
    statuses: this.elements.row.locator('//td[2]'),
    label: (labelName: string) => this.page.locator(`//ul[@aria-label="Tags"]//span[contains(text(), '${labelName}')]`),
    agentTypes: this.elements.row.locator('//td[3]'),
  };

  buttons: any = {
    ...this.buttons,
    options: (serviceName: string) => this.elements.rowByText(serviceName).locator('//button[@data-testid="dropdown-menu-toggle"]'),
    delete: this.page.getByText('Delete'),
    showRowDetails: (serviceName: string) => this.elements.rowByText(serviceName).getByTestId('show-row-details'),
    hideRowDetails: (serviceName: string) => this.elements.rowByText(serviceName).getByTestId('hide-row-details'),
    showDetails: this.page.getByTestId('show-row-details'),
    hideDetails: this.page.getByTestId('hide-row-details'),
    goBackToServices: this.page.getByText('Go back to services'),
  };

  messages: any = {
    ...this.messages,
    successfullyDeleted: (number: number): string => `${number} of ${number} agents successfully deleted`,
    noAgents: 'No agents available',
  };

  verifyAllAgentsStatus = async (expectedStatus: string) => {
    await this.elements.statuses.first().waitFor({
      state: 'visible',
    });
    const agents: ElementHandle[] = await this.elements.statuses.elementHandles();

    for await (const [, agent] of agents.entries()) {
      expect(await agent.textContent()).toEqual(expectedStatus);
    }
  };

  verifyAgentLabelPresent = async (labelName: string) => {
    await this.elements.label(labelName).waitFor({
      state: 'visible',
    });
  };

  verifyAgentLabelVisibleForAgentsExcept = async (labelName: string, exceptions: string[]) => {
    const numberOfAgents = await this.elements.agentsRow.count();

    for (let i = 0; i < numberOfAgents; i++) {
      if (exceptions.indexOf(await this.elements.agentTypes.nth(i).textContent() as string || 'NotExistingExporter') < 0) {
        await this.buttons.showDetails.nth(i).click();
        await this.verifyAgentLabelPresent(labelName);
        await this.buttons.hideDetails.nth(0).click();
      }
    }
  };
}
