/* eslint-disable lines-between-class-members */
import { Page } from '@playwright/test';
import { Toast } from '../../components/toast.component';

export class CommonPage {
  // eslint-disable-next-line no-empty-function
  constructor(readonly page: Page) {}

  toast = new Toast(this.page);
  landingUrl = 'graph/d/pmm-home/home-dashboard?orgId=1&refresh=1m';

  protected baseElements = {
    mainView: this.page.locator('//*[@class="main-view"]'),
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
