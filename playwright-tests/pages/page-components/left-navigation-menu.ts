import { Locator, Page } from '@playwright/test';
import ConfigurationMenu from '@components/sideMenus/configuration-menu';
import Wait from '@helpers/enums/wait';

export class LeftNavigationMenu {
  private shortMenu = this.page.getByTestId('data-testid navigation mega-menu');
  private fullMenu = this.page.getByTestId('navbarmenu');
  private openMenuButton = this.shortMenu.locator('button[aria-label="Open navigation menu"]');
  private closeMenuButton = this.fullMenu.locator('button[aria-label="Close navigation menu"]');

  /** Navigation menus */
  private homeLocator = this.page.locator('a[aria-label="Home"]');
  // Search dashboards
  // Starred
  // Dashboards
  // Operating System (OS)
  // MongoDB
  // PostgreSQL
  // Query Analytics (QAN)
  // Explore
  // Alerting
  // Advisors
  // Backup
  private menuConfiguration?: ConfigurationMenu;
  // Server admin
  // admin
  // Help

  constructor(readonly page: Page) {}

  /**
   * @return {@code false} if short navigation menu is currently on the screen
   */
  private isOpened = async (): Promise<boolean> => {
    return this.fullMenu.isVisible();
  };

  /**
   * Simulates user actions to collapse Left Navigation Bar, with required checks.
   */
  public collapse = async (): Promise<void> => {
    if (!await this.isOpened()) {
      console.log('Left Navigation Bar is already collapsed!');
      return;
    }
    await this.closeMenuButton.click({ trial: true, timeout: Wait.OneSecond });
    await this.closeMenuButton.click();
    await this.fullMenu.waitFor({ state: 'detached', timeout: Wait.OneSecond });
  };

  /**
   * Simulates user actions to collapse Left Navigation Bar, with required checks.
   */
  public expand = async () => {
    if (await this.isOpened()) {
      console.log('Left Navigation Bar is already Expanded!');
      return;
    }
    await this.openMenuButton.click({ trial: true, timeout: Wait.OneSecond });
    await this.openMenuButton.click();
    await this.fullMenu.waitFor({ state: 'visible', timeout: Wait.OneSecond });
  };

  /**
   * Encapsulates click on menu button, since Home is a link.
   */
  public home = async (): Promise<void> => {
    if (await this.isOpened()) {
      await this.fullMenu.locator(this.homeLocator).click({ trial: true, timeout: Wait.OneSecond });
      await this.fullMenu.locator(this.homeLocator).click();
    }
    await this.shortMenu.locator(this.homeLocator).click({ trial: true, timeout: Wait.OneSecond });
    await this.shortMenu.locator(this.homeLocator).click();
  };

  /**
   * @return initialized {@link ConfigurationMenu}
   */
  public configuration = (): ConfigurationMenu => {
    if (!this.menuConfiguration) {
      this.menuConfiguration = new ConfigurationMenu(this.page);
    }
    return this.menuConfiguration;
  };
}
