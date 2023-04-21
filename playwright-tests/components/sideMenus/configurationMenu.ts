import { Page } from '@playwright/test';

export default class ConfigurationMenu {
  constructor(readonly page: Page) { }

  elements = {

  };

  fields = {};

  labels = {
    rbac: 'Access Roles',
    inventory: 'Inventory',
  };

  buttons = {
    rbac: this.page.locator('//li[@data-key="rbac-roles"]'),
    inventory: this.page.locator('//li[@data-key="inventory"]'),
  };

  messages = {};

  links = {
    rbac: "/graph/roles",
  };

}
