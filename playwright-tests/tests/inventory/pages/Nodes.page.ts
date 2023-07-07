import { Page } from '@playwright/test';
import NodesTable from '@tests/tests/inventory/components/nodesTable';
import { InventoryPage } from './Inventory.page';

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
