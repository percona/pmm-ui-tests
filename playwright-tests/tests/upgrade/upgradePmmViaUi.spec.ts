import { test } from '@playwright/test';
import { apiHelper } from '@api/helpers/apiHelper';
import grafanaHelper from '@helpers/grafanaHelper';
import HomeDashboard from '@pages/HomeDashboard.page';

test.describe('Common Upgrade PMM tests', async () => {
  test.describe.configure({
    retries: 0,
  });

  test.beforeEach(async ({ page }) => {
    await grafanaHelper.authorize(page);
    await apiHelper.confirmTour(page);
    await page.goto('');
  });

  test('PMM-T288 Verify user can see Update widget before upgrade [critical] @pmm-upgrade', async ({ page }) => {
    const homeDashboard = new HomeDashboard(page);
    await homeDashboard.pmmUpgrade.verifyUpgradeWidget();
  });

  test('PMM-T3 Verify user is able to Upgrade PMM version [blocker] @pmm-upgrade', async ({ page }) => {
    const homeDashboard = new HomeDashboard(page);

    await homeDashboard.upgradePMM();
  });
});
