import NodesTable from '@tests/inventory/pages/components/nodes-table';
import { InventoryPage } from './inventory.page';

export class NodesPage extends InventoryPage {
  url = 'graph/inventory/nodes';

  nodesTable = new NodesTable(this.page);

  messages: { [key: string]: string } = {
    ...this.messages,
    pmmServerCannotBeRemoved: "PMM Server node can't be removed.",
  };
}
