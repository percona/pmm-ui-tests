import { Locator, Page } from '@playwright/test';
import { LeftNavigationMenu } from '@components/left-navigation-menu';
import ToastMessage from '@components/toast-message-modal';
import OptionsMenu from '@components/options-menu';
import { expect } from '@helpers/test-helper';
import grafanaHelper from '@helpers/grafana-helper';
import NetworkTools from '@components/network-tools';

export class CommonPage {
  PAGE_HEADING_LOCATOR: Locator = this.page.locator('//h1');

  network = new NetworkTools(this.page);
  toastMessage = new ToastMessage(this.page);
  sideMenu = new LeftNavigationMenu(this.page);
  optionMenu = new OptionsMenu(this.page);

  elements: object = {
    mainView: this.page.locator('//*[@class="main-view"]'),
    emptyBlock: this.page.getByTestId('empty-block'),
    noDataTable: this.page.getByTestId('table-no-data'),
    notPlatformUser: this.page.getByTestId('not-platform-user'),
    noData: this.page.getByTestId('page-no-data'),
    notConnectedToPlatform: this.page.getByTestId('not-connected-platform'),
  };

  // TODO: not a part of a page... should be moved to the "toast" system message class
  messages: { [key: string]: string } = {
    loginWithPercona: 'Login with Percona Account to access this content',
    notConnectedToThePortal: 'Not connected to Portal.',
    featureDisabled: 'Feature is disabled.',
  };

  constructor(public readonly page: Page) {}

  /**
   * Authenticates current page at grafana level
   */
  authenticateSession = async () => {
    await grafanaHelper.authorize(this.page);
    return this;
  };

  /**
   * To open Page with specified path by entering url into the address field.
   * Including all required checks
   *
   * @param  pathToPage       the path to open with admin url
   * @param  nameOfPage       the Page Name for pretty logs
   * @param  headingOnPage    the Heading on the page to wait to confirm that page is opened
   */
  protected openPageByPath = async (pathToPage: string, nameOfPage: string, headingOnPage: Locator) => {
    await this.page.goto(pathToPage);
    await expect(this.page).toHaveURL(pathToPage, { timeout: 30_000 });
    await expect(headingOnPage, `Wait for "${nameOfPage}" Page heading to be visible`)
      .toBeVisible({ timeout: 60_000 });
  };
}
