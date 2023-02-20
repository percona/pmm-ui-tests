import { expect, Page } from '@playwright/test';
import Duration from '@helpers/Duration';

export default class PmmUpgrade {
  constructor(readonly page: Page) {}

  containers = {
    upgradeContainer: this.page.locator('//*[@aria-label="PMM Upgrade panel"]'),
  };

  elements = {
    currentVersion: this.containers.upgradeContainer.getByTestId('update-installed-version'),
    availableVersion: this.containers.upgradeContainer.getByTestId('update-latest-version'),
    upToDate: this.containers.upgradeContainer.getByText('You are up to date'),
    lastUpgradeCheckDate: this.containers.upgradeContainer.getByTestId('update-last-check'),
  };

  buttons = {
    upgradeButton: this.containers.upgradeContainer.getByText('Upgrade to', { exact: false }),
  };

  fields = {};

  getPMMVersion = async (versionString: string) => {
    const [versionMajor, versionMinor, versionPatch] = versionString.split('.');
    return { versionMajor, versionMinor, versionPatch };
  };

  getCurrentPMMVersion = async () => {
    await expect(this.elements.currentVersion).toContainText('2.', { timeout: Duration.ThreeMinutes });
    const versionString = await this.elements.currentVersion.textContent();
    const [versionMajorString, versionMinorString, versionPatchString] = versionString!.split('.');
    const versions = {
      versionMajor: parseInt(versionMajorString),
      versionMinor: parseInt(versionMinorString),
      versionPatch: parseInt(versionPatchString),
    };

    return versions;
  };

  verifyUpgradeWidget = async () => {
    await this.buttons.upgradeButton.waitFor({ state: 'visible', timeout: Duration.ThreeMinutes });
    await expect(this.elements.upToDate).toBeHidden();
    await this.elements.lastUpgradeCheckDate.waitFor({ state: 'visible' });
    const availableVersion = await this.elements.availableVersion.textContent();
    await expect(this.elements.currentVersion).not.toHaveText(availableVersion!);
  };
}
