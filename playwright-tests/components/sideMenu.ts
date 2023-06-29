import { Page } from '@playwright/test';
import ConfigurationMenu from './sideMenus/configurationMenu';

export class SideMenu {
  constructor(readonly page: Page) {}

  sideMenu = this.page.getByTestId('sidemenu');

  configuration = new ConfigurationMenu(this.page);

  elements = {
    tickets: this.sideMenu.locator('//*[@href="/graph/tickets"]'),
    entitlements: this.sideMenu.locator('//*[@href="/graph/entitlements"]'),
    environmentOverview: this.sideMenu.locator('//*[@href="/graph/environment-overview"]'),
    configuration: this.sideMenu.locator('//a[@aria-label="Configuration"]')
  };
}
