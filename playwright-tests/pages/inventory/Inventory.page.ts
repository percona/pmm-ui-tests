import { Page } from '@playwright/test';
import { CommonPage } from '../Common.page';

export class InventoryPage extends CommonPage {
  constructor(page: Page) {
    super(page);
  }

  private inventoryElements = {
    ...super.getElements(),
  };

  private inventoryFields = {
    ...super.getFields(),
  };

  private inventoryLabels = {
    ...super.getLabels(),
  };

  private inventoryButtons = {
    ...super.getButtons(),
    servicesTab: this.page.locator('//a[@aria-label="Tab Services"]'),
    nodesTab: this.page.locator('//a[@aria-label="Tab Nodes"]'),
    delete: this.page.locator('//span[text()="Delete"]//ancestor::button'),
  };

  private inventoryMessages = {
    ...super.getMessages(),
  };

  private inventoryLinks = {
    ...super.getLinks(),
  };

  protected getInventoryElements() {
    return this.inventoryElements;
  }

  protected getInventoryFields() {
    return this.inventoryFields;
  }

  protected getInventoryLabels() {
    return this.inventoryLabels;
  }

  protected getInventoryButtons() {
    return this.inventoryButtons;
  }

  protected getInventoryMessages() {
    return this.inventoryMessages;
  }

  protected getInventoryLinks() {
    return this.inventoryLinks;
  }
}
