import { expect } from '@playwright/test';
import PmmUpgradeWidget from '@components/pmm-upgrade-widget';
import UpgradeModal from '@components/upgrade-modal';
import Wait from '@helpers/enums/wait';
import PmmMenu from '@components/dashboards/pmm-menu';
import { BaseDashboard } from './dashboards/base-dashboard.page';

export default class HomeDashboardPage extends BaseDashboard {
  readonly PAGE_PATH = 'graph/d/pmm-home/home-dashboard?orgId=1&refresh=1m';
  readonly PAGE_HEADING = 'Home Dashboard';

  pmmUpgradeWidget = new PmmUpgradeWidget(this.page);
  upgradeModal = new UpgradeModal(this.page);
  pmmMenu = new PmmMenu(this.page);

  /**
   * Opens given Page entering url into the address field.
   */
  public open = async () => {
    await this.openPageByPath(this.PAGE_PATH, this.PAGE_HEADING, this.PAGE_HEADING_LOCATOR);
  };

  async waitToBeOpened() {
    await this.PAGE_HEADING_LOCATOR.waitFor({ state: 'visible', timeout: Wait.OneMinute });
    await expect(this.page).toHaveURL(this.PAGE_PATH);
  }
  upgradePmm = async () => {
    await this.pmmUpgradeWidget.elements.upgradeButton.waitFor({ state: 'visible', timeout: Wait.TwoMinutes });

    const currentVersion = await this.pmmUpgradeWidget.elements.currentVersion.textContent();

    await this.pmmUpgradeWidget.elements.upgradeButton.click();
    const availableVersion = await this.pmmUpgradeWidget.elements.availableVersion.textContent();

    console.log(`Upgrading pmm server from version: ${currentVersion} to the version: ${availableVersion}`);

    await this.upgradeModal.containers.modalContainer.waitFor({ state: 'visible', timeout: Wait.OneMinute });
    await this.upgradeModal.elements.upgradeInProgressHeader
      .waitFor({ state: 'visible', timeout: Wait.OneMinute });
    await expect(this.upgradeModal.elements.upgradeSuccess)
      .toHaveText(this.upgradeModal.messages.upgradeSuccess(availableVersion) as string, { timeout: Wait.TenMinutes });
    await this.upgradeModal.buttons.close.click();
  };
}
