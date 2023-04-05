import { Page } from '@playwright/test';
import AdvisorsMenu from './sideMenus/advisorsMenu';
import ConfigurationMenu from './sideMenus/configurationMenu';

export class SideMenu {
  constructor(readonly page: Page) { }

  sideMenu = this.page.getByTestId('sidemenu');

  configuration = new ConfigurationMenu(this.page);
  advisors = new AdvisorsMenu(this.page);

  elements = {
    home: this.sideMenu.locator('//a[@aria-label="Home"]'),
    tickets: this.sideMenu.locator('//*[@href="/graph/tickets"]'),
    entitlements: this.sideMenu.locator('//*[@href="/graph/entitlements"]'),
    environmentOverview: this.sideMenu.locator('//*[@href="/graph/environment-overview"]'),
    configuration: this.sideMenu.locator('//a[@aria-label="Configuration"]'),
    advisors: this.sideMenu.locator('//a[@aria-label="Advisors"]')
  };
}
