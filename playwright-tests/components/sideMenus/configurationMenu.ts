import { Page } from '@playwright/test';

export default class ConfigurationMenu {
  constructor(readonly page: Page) { }

  elements = {
    
  };

  fields = {};

  labels = {
    rbac: 'Access Roles',
  };

  buttons = {
    rbac: this.page.locator('//li[@data-key="rbac-roles"]'),
  };

  messages = {};

  links = {
    rbac: "/graph/roles",
  };

}
