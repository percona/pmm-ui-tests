import Grafana from './grafanaApi';
import Inventory from './inventoryApi';

export = {
  grafana: new Grafana(),
  inventory: new Inventory(),
}
