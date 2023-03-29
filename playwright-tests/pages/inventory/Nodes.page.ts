import { expect, Page } from '@playwright/test';
import NodesTable from '@tests/components/configuration/nodesTable';
import { InventoryPage } from './Inventory.page';

export class NodesPage extends InventoryPage {
  constructor(page: Page) {
    super(page);
  }

  url = 'graph/inventory/nodes';

  nodesTable = new NodesTable(this.page);

  elements = {
    ...super.getInventoryElements(),
  };

  fields = {
    ...super.getInventoryFields(),
  };

  labels = {
    ...super.getInventoryLabels(),
  };

  buttons = {
    ...super.getInventoryButtons(),
  };

  messages = {
    ...super.getInventoryMessages(),
  };

  links = {
    ...super.getInventoryLinks(),
  };

}
