import { Locator, Page } from '@playwright/test';
import ConfigurationMenu from '@components/sideMenus/configuration-menu';

export class LeftNavigationMenu {
  constructor(readonly page: Page) {}

  private sideMenu = this.page.getByTestId('sidemenu');

  configuration = new ConfigurationMenu(this.page);

  elements: { [key: string]: Locator } = {
    tickets: this.sideMenu.locator('//*[@href="/graph/tickets"]'),
    entitlements: this.sideMenu.locator('//*[@href="/graph/entitlements"]'),
    environmentOverview: this.sideMenu.locator('//*[@href="/graph/environment-overview"]'),
    configuration: this.sideMenu.locator('//a[@aria-label="Configuration"]')
  };
}
