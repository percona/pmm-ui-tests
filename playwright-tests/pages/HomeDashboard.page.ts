import { expect, Page } from '@playwright/test';
import PmmUpgrade from '@components/pmmUpgrade';
import UpgradeModal from '@components/upgradeModal';
import Duration from '@helpers/Duration';
import PmmMenu from '@tests/components/dasboards/homeDashboard/pmmMenu';
import { BaseDashboard } from './dashboards/BaseDashboard.page';

export default class HomeDashboard extends BaseDashboard {
  pmmUpgrade = new PmmUpgrade(this.page);
  upgradeModal = new UpgradeModal(this.page);
  pmmMenu = new PmmMenu(this.page);

  elements = {
    ...super.getBaseDashboardElements(),
  };

  fields = {
    ...super.getBaseDashboardFields(),
  };

  labels = {
    ...super.getBaseDashboardLabels(),

  };

  buttons = {
    ...super.getBaseDashboardButtons(),
  };

  messages = {
    ...super.getBaseDashboardMessages(),
  };

  links = {
    ...super.getBaseDashboardLinks(),
  };

  upgradePMM = async () => {
    await this.pmmUpgrade.buttons.upgradeButton.waitFor({
      state: 'visible', timeout: Duration.ThreeMinutes,
    });
    const currentVersion = await this.pmmUpgrade.elements.currentVersion.textContent();

    await this.pmmUpgrade.buttons.upgradeButton.click();
    const availableVersion = await this.pmmUpgrade.elements.availableVersion.textContent();

    console.log(`Upgrading pmm server from version: ${currentVersion} to the version: ${availableVersion}`);

    await this.upgradeModal.containers.modalContainer.waitFor({
      state: 'visible', timeout: Duration.OneMinute,
    });
    await this.upgradeModal.elements.upgradeInProgressHeader.waitFor({
      state: 'visible', timeout: Duration.OneMinute,
    });
    await expect(this.upgradeModal.elements.upgradeSuccess).toHaveText(
      this.upgradeModal.messages.upgradeSuccess(availableVersion!),
      {
        timeout: Duration.TenMinutes,
      },
    );
    await this.upgradeModal.buttons.close.click();
  };
}
