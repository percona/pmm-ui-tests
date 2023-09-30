import { expect, Page } from '@playwright/test';
import Wait from '@helpers/enums/wait';

export default class PmmUpgradeWidget {
  constructor(readonly page: Page) {}

  containers = { upgradeContainer: this.page.locator('//*[@aria-label="PMM Upgrade panel"]') };

  elements: any = {
    currentVersion: this.containers.upgradeContainer.getByTestId('update-installed-version'),
    availableVersion: this.containers.upgradeContainer.getByTestId('update-latest-version'),
    upToDate: this.containers.upgradeContainer.getByText('You are up to date'),
    lastUpgradeCheckDate: this.containers.upgradeContainer.getByTestId('update-last-check'),
    upgradeButton: this.containers.upgradeContainer.getByText('Upgrade to', { exact: false }),
  };

  verifyUpgradeWidget = async () => {
    await this.elements.upgradeButton.waitFor({ state: 'visible', timeout: Wait.ThreeMinutes });
    await expect(this.elements.upToDate).toBeHidden();
    await this.elements.lastUpgradeCheckDate.waitFor({ state: 'visible' });
    const availableVersion: string = await this.elements.availableVersion.textContent();
    await expect(this.elements.currentVersion).not.toHaveText(availableVersion);
  };
}
