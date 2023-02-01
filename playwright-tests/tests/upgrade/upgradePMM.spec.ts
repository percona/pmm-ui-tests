import { test } from '@playwright/test';
import apiHelper from '../../api/apiHelper';
import grafanaHelper from '../../helpers/GrafanaHelper';
import HomeDashboard from '../../pages/HomeDashboard.page';

test.describe('Spec file for Upgrade PMM tests', async () => {
  
  test.describe.configure({ retries: 0 });

  test.beforeEach(async ({page}) => {
    await grafanaHelper.authorize(page);
    await apiHelper.confirmTour(page);
    await page.goto('');
  })

  test('PMM-T288 Verify user can see Update widget before upgrade [critical] @pre-upgrade @ovf-upgrade @ami-upgrade @pmm-upgrade', async ({page}) => {
    
    const homeDashboard = new HomeDashboard(page);
    await homeDashboard.pmmUpgrade.verifyUpgradeWidget();
  });

  test('PMM-T3 Verify user is able to Upgrade PMM version [blocker] @pmm-upgrade @ovf-upgrade @ami-upgrade', async ({page}) => {
    const homeDashboard = new HomeDashboard(page);

    await homeDashboard.upgradePMM();
  });
});