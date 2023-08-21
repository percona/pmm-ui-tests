import { test } from '@helpers/test-helper';
import apiHelper from '@api/helpers/api-helper';
import grafanaHelper from '@helpers/grafana-helper';

test.describe('Common Upgrade PMM tests', async () => {
  test.describe.configure({ retries: 0 });

  test.beforeEach(async ({ page }) => {
    await grafanaHelper.authorize(page);
    await apiHelper.confirmTour(page);
    await page.goto('');
  });

  test('PMM-T288 Verify user can see Update widget before upgrade [critical] @pmm-upgrade', async ({ homeDashboardPage }) => {
    await homeDashboardPage.pmmUpgrade.verifyUpgradeWidget();
  });

  test('PMM-T3 Verify user is able to Upgrade PMM version [blocker] @pmm-upgrade', async ({ homeDashboardPage }) => {
    await homeDashboardPage.upgradePmm();
  });
});
