import { expect, Page, test } from '@playwright/test';
import PmmUpgrade from '@components/pmmUpgrade';
import UpgradeModal from '@components/upgradeModal';
import Duration from '@helpers/Duration';
import { BaseDashboard } from './dashboards/BaseDashboard.page';

export default class HomeDashboard extends BaseDashboard {
  constructor(page: Page) {
    super(page);
  }

  pmmUpgrade = new PmmUpgrade(this.page);
  upgradeModal = new UpgradeModal(this.page);
  private failedAdvisorsPanel = this.page.locator('//section[@aria-label="Failed Advisors panel"]');

  elements = {
    ...super.getBaseDashboardElements(),
    failedAdvisorsPanel: {
      advisorLink: this.failedAdvisorsPanel.getByTestId('db-check-panel-has-checks').locator('//a'),
      criticalAdvisors: this.failedAdvisorsPanel.getByTestId('db-check-panel-critical'),
      errorAdvisors: this.failedAdvisorsPanel.getByTestId('db-check-panel-error'),
      warningAdvisors: this.failedAdvisorsPanel.getByTestId('db-check-panel-warning'),
      noticeAdvisors: this.failedAdvisorsPanel.getByTestId('db-check-panel-notice')
    }

  }

  upgradePMM = async () => {
    await this.pmmUpgrade.buttons.upgradeButton.waitFor({ state: 'visible', timeout: Duration.ThreeMinutes });
    await this.pmmUpgrade.buttons.upgradeButton.click();
    const availableVersion = await this.pmmUpgrade.elements.availableVersion.textContent();

    await this.upgradeModal.containers.modalContainer.waitFor({ state: 'visible', timeout: Duration.OneMinute });
    await this.upgradeModal.elements.upgradeInProgressHeader.waitFor({ state: 'visible', timeout: Duration.OneMinute });
    await expect(this.upgradeModal.elements.upgradeSuccess).toHaveText(
      this.upgradeModal.messages.upgradeSuccess(availableVersion!),
      { timeout: Duration.TenMinutes },
    );
    await this.upgradeModal.buttons.close.click();
  };

  verifyFailedAdvisorsStatus = async (options: { critical?: number, error?: number, warning?: number, notice?: number }) => {
    if (options.critical) {
      await expect.soft(this.elements.failedAdvisorsPanel.criticalAdvisors).toHaveText(options.critical.toString(), { timeout: Duration.ThreeMinutes })
    }
    if (options.error) {
      await expect.soft(this.elements.failedAdvisorsPanel.errorAdvisors).toHaveText(options.error.toString(), { timeout: Duration.ThreeMinutes })
    }
    if (options.warning) {
      await expect.soft(this.elements.failedAdvisorsPanel.warningAdvisors).toHaveText(options.warning.toString(), { timeout: Duration.ThreeMinutes })
    }
    if (options.notice) {
      await expect.soft(this.elements.failedAdvisorsPanel.noticeAdvisors).toHaveText(options.notice.toString(), { timeout: Duration.ThreeMinutes })
    }

    expect(
      test.info().errors,
      `'Contains all elements' failed with ${test.info().errors.length} error(s):\n${test.info().error}`
    ).toHaveLength(0);
  }
}
