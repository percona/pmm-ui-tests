import { Page } from '@playwright/test';
import NodesTable from '@tests/inventory/pages/components/nodes-table';
import { InventoryPage } from './inventory.page';

export class NodesPage extends InventoryPage {
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
    pmmServerCannotBeRemoved: "PMM Server node can't be removed.",
  };

  links = {
    ...super.getInventoryLinks(),
  };
}
