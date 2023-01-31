import { expect, Page } from '@playwright/test';
import PmmUpgrade from '../components/pmmUpgrade.component';
import UpgradeModal from '../components/upgradeModal.component';
import Duration from '../helpers/Duration';
import { CommonPage } from './Common.page';

export default class HomeDashboard extends CommonPage {
  constructor(page: Page) {
    super(page);
  }

  pmmUpgrade = new PmmUpgrade(this.page);
  upgradeModal = new UpgradeModal(this.page);

  upgradePMM = async () => {
    await this.pmmUpgrade.buttons.upgradeButton.waitFor({ state: 'visible', timeout: Duration.ThreeMinutes });
    await this.pmmUpgrade.buttons.upgradeButton.click()
    const availableVersion = await this.pmmUpgrade.elements.availableVersion.textContent();

    await this.upgradeModal.containers.modalContainer.waitFor({ state: 'visible', timeout: Duration.OneMinute });
    await this.upgradeModal.elements.upgradeInProgressHeader.waitFor({ state: 'visible', timeout: Duration.OneMinute });
    await expect(this.upgradeModal.elements.upgradeSuccess).toHaveText(this.upgradeModal.messages.upgradeSuccess(availableVersion!), { timeout: Duration.TenMinutes });
    await this.upgradeModal.buttons.close.click();
  };
}
