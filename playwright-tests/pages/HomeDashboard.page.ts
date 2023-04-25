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

  verifyFailedAdvisorsNumberIsGreaterThen = async (options: { critical?: number, error?: number, warning?: number, notice?: number }) => {
    await this.elements.failedAdvisorsPanel.criticalAdvisors.waitFor({ state: 'visible', timeout: Duration.ThirtySecond });
    if (options.critical) {
      const criticalAdvisors = await this.elements.failedAdvisorsPanel.criticalAdvisors.textContent();
      expect.soft(parseInt(criticalAdvisors || '')).toBeGreaterThanOrEqual(options.critical);
    }
    if (options.error) {
      const errorAdvisors = await this.elements.failedAdvisorsPanel.errorAdvisors.textContent()
      expect.soft(parseInt(errorAdvisors || '')).toBeGreaterThanOrEqual(options.error);
    }
    if (options.warning) {
      const warningAdvisors = await this.elements.failedAdvisorsPanel.warningAdvisors.textContent()
      expect.soft(parseInt(warningAdvisors || '')).toBeGreaterThanOrEqual(options.warning);
    }
    if (options.notice) {
      const noticeAdvisors = await this.elements.failedAdvisorsPanel.noticeAdvisors.textContent()
      expect.soft(parseInt(noticeAdvisors || '')).toBeGreaterThanOrEqual(options.notice);
    }

    let errors: string[] = [];
    for (const obj of test.info().errors) {
      if (obj.message) {
        errors.push(`\t${obj.message.split('\n')[0]}`);
      }

    }

    expect(
      test.info().errors,
      `'Failed advisors status' failed with ${test.info().errors.length} error(s):\n${errors.join('\n')}`
    ).toHaveLength(0);
  }
}
