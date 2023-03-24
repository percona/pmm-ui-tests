import {expect, test} from '@playwright/test';
import {v1} from '@api/v1';
import grafanaHelper from '@helpers/GrafanaHelper';
import HomeDashboard from '@pages/HomeDashboard.page';
import {SettingProperty} from "@api/v1/settingsApi";

test.describe('General Upgrade PMM tests', async () => {
  test.describe.configure({ retries: 0 });

  test.beforeEach(async ({ page }) => {
    await grafanaHelper.authorize(page);
    await v1.confirmTour(page);
    await page.goto('');
  });

  test('PMM-T288 Verify user can see Update widget before upgrade [critical] @pre-upgrade @ovf-upgrade @ami-upgrade @pmm-upgrade', async ({
    page,
  }) => {
    const homeDashboard = new HomeDashboard(page);
    await homeDashboard.pmmUpgrade.verifyUpgradeWidget();
  });

  test('PMM-T3 Verify user is able to Upgrade PMM version [blocker] @pmm-upgrade @ovf-upgrade @ami-upgrade', async ({ page }) => {
    const homeDashboard = new HomeDashboard(page);

    await homeDashboard.upgradePMM();
  });
//TODO: if PMM minor version < 36
  test('PMM-T1659 ensure BM is OFF by default before 2.36.0 version @pre-upgrade @ovf-upgrade @ami-upgrade',
      async ({ }) => {
        const property = await v1.settings.getSettingsProperty(SettingProperty.bm);
        await expect(property).toBeUndefined();
      },
  );

//TODO: if PMM minor version >= 36
  test('PMM-T1659 Verify that BM is enabled by default after upgrade starting to 2.36.0 and newer @post-upgrade',
      async ({ }) => {
        const property = await v1.settings.getSettingsProperty(SettingProperty.bm);
        await expect(property).toBeUndefined();
      },
  );
});
