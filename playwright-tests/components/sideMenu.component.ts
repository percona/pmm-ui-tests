/* eslint-disable lines-between-class-members, no-empty-function */
import { Page, expect } from '@playwright/test';
import Duration from '../helpers/Duration';

export class SideMenu {
  constructor(readonly page: Page) {}

  sideMenu= this.page.getByTestId('sidemenu');

  elements = {
    tickets: this.sideMenu.locator('//*[@href="/graph/tickets"]'),
  };
}


