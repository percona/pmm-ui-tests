import { Page } from '@playwright/test';
import Wait from '@helpers/enums/wait';
import { expect } from '@helpers/test-helper';

/**
 * Contains implemented actions which can be performed for "Configuration" menu
 * in the global Left Navigation panel
 */
export default class ConfigurationMenu {
  private leftNavShort = this.page.getByTestId('sidemenu');
  private leftNavFull = this.page.getByTestId('navbarmenu');

  private shortMenuButton = this.leftNavShort.locator('//a[@aria-label="Configuration"]');
  private hoverMenuContainer = this.page.locator('#navbar-menu-portal-container ul[role="menu"]');

  private fullMenuButton = this.page.locator('//button[contains(@aria-controls, "collapse-content") and '
      + '(following-sibling::div[.//span[text()="Configuration"]])]');

  /** menu Items */
  private configuration = this.page.locator('//li[@data-key="cfg" or (a[.//text()=""])]');
  private addService = this.page.locator('//li[@data-key="add-instance" or (a[.//text()="Add Service"])]');
  private inventory = this.page.locator('//li[@data-key="inventory" or (a[.//text()="Inventory"])]');
  private settings = this.page.locator('//li[@data-key="settings" or (a[.//text()="Settings"])]');
  private dataSources = this.page.locator('//li[@data-key="datasources" or (a[.//text()="Data sources"])]');
  private users = this.page.locator('//li[@data-key="users" or (a[.//text()="Users"])]');
  // TODO: implement some method to check menu presence
  accessRoles = this.page.locator('//li[@data-key="rbac-roles" or (a[.//text()="Inventory"])]');
  private teams = this.page.locator('//li[@data-key="teams" or (a[.//text()="Teams"])]');
  private plugins = this.page.locator('//li[@data-key="plugins" or (a[.//text()="Plugins"])]');
  private preferences = this.page.locator('//li[@data-key="org-settings" or (a[.//text()="Preferences"])]');
  private apiKeys = this.page.locator('//li[@data-key="apikeys" or (a[.//text()="API keys"])]');
  private serviceAccounts = this.page
    .locator('//li[@data-key="serviceaccounts" or (a[.//text()="Service accounts"])]');

  constructor(readonly page: Page) { }

  /**
   * @return {@code false} if short navigation menu is currently on the screen
   */
  private isFullMenu = async (): Promise<boolean> => {
    return this.leftNavFull.isVisible();
  };

  /**
   * Opens Configuration menu in any left navigation state(short or opened)
   */
  showMenu = async () => {
    if (await this.isFullMenu()) {
      await this.fullMenuButton.click({ trial: true, timeout: Wait.OneSecond });
      await this.fullMenuButton.click();
      await expect(this.fullMenuButton).toHaveAttribute('aria-expanded', 'true', { timeout: Wait.OneSecond });
    } else {
      await this.shortMenuButton.click({ trial: true, timeout: Wait.OneSecond });
      await this.shortMenuButton.hover();
      await this.hoverMenuContainer.waitFor({ state: 'visible', timeout: Wait.OneSecond });
    }
  };

  public selectConfiguration = async () => {
    await this.showMenu();
    await this.configuration.click({ trial: true, timeout: Wait.OneSecond });
    await this.configuration.click();
  };

  public selectAddService = async () => {
    await this.showMenu();
    await this.addService.click({ trial: true, timeout: Wait.OneSecond });
    await this.addService.click();
  };

  public selectInventory = async () => {
    await this.showMenu();
    await this.inventory.click({ trial: true, timeout: Wait.OneSecond });
    await this.inventory.click();
  };

  public selectSettings = async () => {
    await this.showMenu();
    await this.settings.click({ trial: true, timeout: Wait.OneSecond });
    await this.settings.click();
  };

  public selectDataSources = async () => {
    await this.showMenu();
    await this.dataSources.click({ trial: true, timeout: Wait.OneSecond });
    await this.dataSources.click();
  };

  public selectUsers = async () => {
    await this.showMenu();
    await this.users.click({ trial: true, timeout: Wait.OneSecond });
    await this.users.click();
  };

  public selectAccessRoles = async () => {
    await this.showMenu();
    await this.accessRoles.click({ trial: true, timeout: Wait.TenSeconds });
    await this.accessRoles.click();
  };

  public selectTeams = async () => {
    await this.showMenu();
    await this.teams.click({ trial: true, timeout: Wait.OneSecond });
    await this.teams.click();
  };

  public selectPlugins = async () => {
    await this.showMenu();
    await this.plugins.click({ trial: true, timeout: Wait.OneSecond });
    await this.plugins.click();
  };

  public selectPreferences = async () => {
    await this.showMenu();
    await this.preferences.click({ trial: true, timeout: Wait.OneSecond });
    await this.preferences.click();
  };

  public selectApiKeys = async () => {
    await this.showMenu();
    await this.apiKeys.click({ trial: true, timeout: Wait.OneSecond });
    await this.apiKeys.click();
  };

  public selectServiceAccounts = async () => {
    await this.showMenu();
    await this.serviceAccounts.click({ trial: true, timeout: Wait.OneSecond });
    await this.serviceAccounts.click();
  };
}
