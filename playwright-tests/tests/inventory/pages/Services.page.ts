import { expect } from '@playwright/test';
import ServicesTable from '@tests/tests/inventory/components/servicesTable';
import { InventoryPage } from './Inventory.page';
import AgentsTable from '../components/agentsTable';

export class ServicesPage extends InventoryPage {
  url = 'graph/inventory/services';

  servicesTable = new ServicesTable(this.page);
  agentsTable = new AgentsTable(this.page);

  elements = {
    ...super.getInventoryElements(),
    runningStatusAgent: this.page.locator('//span[text()="Running"]'),
    waitingStatusAgent: this.page.locator('//span[text()="Waiting"]'),
  };

  fields = {
    ...super.getInventoryFields(),
  };

  labels = {
    ...super.getInventoryLabels(),
  };

  buttons = {
    ...super.getInventoryButtons(),
    addService: this.page.locator('//span[text()="Add Service"]//ancestor::button'),
    goBackToServices: this.page.getByText('Go back to services'),
  };

  messages = {
    ...super.getInventoryMessages(),
  };

  links = {
    ...super.getInventoryLinks(),
  };

  verifyPageLoaded = async () => {
    await expect(this.buttons.servicesTab).toBeVisible();
    await expect(this.buttons.nodesTab).toBeVisible();
    await expect(this.buttons.addService).toBeVisible();
    await expect(this.buttons.delete).toBeVisible();
    await expect(this.servicesTable.elements.body).toBeVisible();
  };
}
