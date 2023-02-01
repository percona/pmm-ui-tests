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

  private baseElements = {
    mainView: this.page.locator('//*[@class="main-view"]'),
    emptyBlock: this.page.getByTestId('empty-block'),
    noDataTable: this.page.getByTestId('table-no-data'),
    notPlatformUser: this.page.getByTestId('not-platform-user'),
    noData: this.page.getByTestId('page-no-data'),
    notConnectedToPlatform: this.page.getByTestId('not-connected-platform'),
  };

  protected fields = {};

  protected labels = {};

  protected buttons = {};

  private baseMessages = {
    loginWithPercona: 'Login with Percona Account to access this content',
    notConnectedToThePortal: 'Not connected to Portal.',
  };

  protected links = {};
  
  protected getElements() {
    return this.baseElements;
  };

  protected getMessages() {
    return this.baseMessages;
  };
}
