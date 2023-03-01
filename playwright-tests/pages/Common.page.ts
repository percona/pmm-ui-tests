import { Page } from '@playwright/test';
import { SideMenu } from '@components/sideMenu';
import { Toast } from '@components/toast';
import OptionsMenu from '@tests/components/optionsMenu';

export class CommonPage {
  constructor(readonly page: Page) {}

  toast = new Toast(this.page);
  sideMenu = new SideMenu(this.page);
  optionMenu = new OptionsMenu(this.page);

  landingUrl = 'graph/d/pmm-home/home-dashboard?orgId=1&refresh=1m';

  private baseElements = {
    mainView: this.page.locator('//*[@class="main-view"]'),
    emptyBlock: this.page.getByTestId('empty-block'),
    noDataTable: this.page.getByTestId('table-no-data'),
    notPlatformUser: this.page.getByTestId('not-platform-user'),
    noData: this.page.getByTestId('page-no-data'),
    notConnectedToPlatform: this.page.getByTestId('not-connected-platform'),
  };

  private baseFields = {};

  private baseLabels = {};

  private baseButtons = {
    home: this.page.locator('//*[@aria-label="Home"]'),
  };

  private baseMessages = {
    loginWithPercona: 'Login with Percona Account to access this content',
    notConnectedToThePortal: 'Not connected to Portal.',
    featureDisabled: 'Feature is disabled.',
  };

  private baseLinks = {};

  protected getElements() {
    return this.baseElements;
  }

  protected getFields() {
    return this.baseFields;
  }

  protected getLabels() {
    return this.baseLabels;
  }

  protected getButtons() {
    return this.baseButtons;
  }

  protected getMessages() {
    return this.baseMessages;
  }

  protected getLinks() {
    return this.baseLinks;
  }
}
