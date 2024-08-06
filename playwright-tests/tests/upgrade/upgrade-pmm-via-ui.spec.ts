import { test } from '@helpers/test-helper';
import Wait from '@helpers/enums/wait';

test.describe('Common Upgrade PMM tests', async () => {
  test.describe.configure({ retries: 0 });

  test.beforeEach(async ({ homeDashboardPage }) => {
    await homeDashboardPage.authenticateSession();
    await homeDashboardPage.network.suppressTour();
    await homeDashboardPage.open();
  });

  test('PMM-T288 Verify user can see Update widget before upgrade [critical] @pmm-upgrade', async ({ homeDashboardPage }) => {
    await homeDashboardPage.pmmUpgradeWidget.verifyUpgradeWidget();
  });

  test('PMM-T3 Verify user is able to Upgrade PMM version [blocker] @pmm-upgrade', async ({ homeDashboardPage }) => {
    test.setTimeout(Wait.TwentyMinutes);
    await homeDashboardPage.upgradePmm();
  });
});
