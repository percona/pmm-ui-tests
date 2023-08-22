import { CommonPage } from '@pages/common.page';
import ConfirmDeleteModal from '@tests/inventory/pages/components/confirm-delete-modal';

export class InventoryPage extends CommonPage {
  confirmDeleteModal = new ConfirmDeleteModal(this.page);

  elements: any = {
    ...this.elements,
    servicesTab: this.page.locator('//a[@aria-label="Tab Services"]'),
    nodesTab: this.page.locator('//a[@aria-label="Tab Nodes"]'),
    deleteButton: this.page.locator('//span[text()="Delete"]//ancestor::button'),
  };
}
