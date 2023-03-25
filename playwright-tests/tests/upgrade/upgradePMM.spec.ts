import {expect, test} from '@playwright/test';
import {api} from '@api/api';
import grafanaHelper from '@helpers/GrafanaHelper';
import HomeDashboard from '@pages/HomeDashboard.page';
import {SettingProperty} from "@api/settingsApiV1";
// import apiHelper from "@api/helpers/apiHelper";

test.describe('General Upgrade PMM tests', async () => {
  test.describe.configure({ retries: 0 });
    let pmmVersion: number = (await api.serverV1.getPmmVersion()).minor;

  // test.beforeAll(async () => {
  //   if (!pmmVersion) {
  //     pmmVersion = (await api.serverV1.getPmmVersion()).minor;
  //   }
  // });

  test.beforeEach(async ({ page }) => {
    await grafanaHelper.authorize(page);
    await api.confirmTour(page);
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

  if (pmmVersion < 36) {
      test('PMM-T1659 ensure BM is OFF by default before 2.36.0 version @pre-upgrade @ovf-upgrade @ami-upgrade',
          async ({}) => {
              const property = await api.settingsV1.getSettingsProperty(SettingProperty.bm);
              await expect(property).toBeUndefined();
          },
      );
  }

  if (pmmVersion >= 36) {
      test('PMM-T1659 Verify that BM is enabled by default after upgrade starting to 2.36.0 and newer @post-upgrade',
          async ({}) => {
              const property = await api.settingsV1.getSettingsProperty(SettingProperty.bm);
              await expect(property).toBe(true);
          },
      );
  }
});
