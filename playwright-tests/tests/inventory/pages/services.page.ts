import { expect } from '@playwright/test';
import ServicesTable from '@tests/inventory/pages/components/services-table';
import AgentsTable from '@tests/inventory/pages/components/agents-table';
import { InventoryPage } from './inventory.page';

export class ServicesPage extends InventoryPage {
  url = 'graph/inventory/services';

  servicesTable = new ServicesTable(this.page);
  agentsTable = new AgentsTable(this.page);

  elements: any = {
    ...this.elements,
    runningStatusAgent: this.page.locator('//span[text()="Running"]'),
    waitingStatusAgent: this.page.locator('//span[text()="Waiting"]'),
  };

  buttons = {
    addService: this.page.locator('//span[text()="Add Service"]//ancestor::button'),
    goBackToServices: this.page.getByText('Go back to services'),
  };

  verifyPageLoaded = async () => {
    await expect(this.elements.servicesTab).toBeVisible();
    await expect(this.elements.nodesTab).toBeVisible();
    await expect(this.buttons.addService).toBeVisible();
    await expect(this.elements.deleteButton).toBeVisible();
    await expect(this.servicesTable.elements.body).toBeVisible();
  };
}
