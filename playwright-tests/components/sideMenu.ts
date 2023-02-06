import { Page } from '@playwright/test';

export class SideMenu {
  constructor(readonly page: Page) {}

  sideMenu = this.page.getByTestId('sidemenu');

  elements = {
    tickets: this.sideMenu.locator('//*[@href="/graph/tickets"]'),
    entitlements: this.sideMenu.locator('//*[@href="/graph/entitlements"]'),
    environmentOverview: this.sideMenu.locator('//*[@href="/graph/environment-overview"]'),
  };
}
