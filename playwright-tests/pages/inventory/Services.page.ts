import { expect, Page } from '@playwright/test';
import ServicesTable from '@tests/components/configuration/servicesTable';
import { InventoryPage } from './Inventory.page';

export class ServicesPage extends InventoryPage {
  constructor(page: Page) {
    super(page);
  }

  url = 'graph/inventory/services';

  servicesTable = new ServicesTable(this.page);

  elements = {
    ...super.getInventoryElements(),
    runningStatusAgent: this.page.locator('//span[text()="Running"]'),
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
    await expect(this.buttons.deleteService).toBeVisible();
    await expect(this.servicesTable.elements.body).toBeVisible();
  }
}
