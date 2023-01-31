/* eslint-disable lines-between-class-members */
import { Page } from '@playwright/test';
import { SideMenu } from '../components/sideMenu.component';
import { Toast } from '../components/toast.component';

export class CommonPage {
  // eslint-disable-next-line no-empty-function
  constructor(readonly page: Page) {}

  toast = new Toast(this.page);
  sideMenu = new SideMenu(this.page);

  landingUrl = 'graph/d/pmm-home/home-dashboard?orgId=1&refresh=1m';

  protected baseElements = {
    mainView: this.page.locator('//*[@class="main-view"]'),
    emptyBlock: this.page.getByTestId('empty-block'),
    noDataTable: this.page.getByTestId('table-no-data'),
  };

  protected fields = {};

  protected labels = {};

  protected buttons = {};

  protected messages = {};

  protected links = {};
  
  protected getElements() {
    return this.baseElements;
  };
}
