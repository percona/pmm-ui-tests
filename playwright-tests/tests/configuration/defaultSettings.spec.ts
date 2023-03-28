import {expect, test} from '@playwright/test';
import {api} from '@api/api';
import apiHelper from "@api/helpers/apiHelper";
import grafanaHelper from '@helpers/GrafanaHelper';
import HomeDashboard from '@pages/HomeDashboard.page';
import {SettingProperty} from "@tests/tests/configuration/api/settings";

test.describe('Default Settings tests', async () => {
  test.describe.configure({ retries: 0 });
  let pmmVersion: number;

  test.beforeAll(async () => {
    pmmVersion = (await api.pmm.serverV1.getPmmVersion()).minor;
  });

  test('PMM-T1659 ensure BM is OFF by default before 2.36.0 version' +
      ' @config-pre-upgrade @config',
    async ({}) => {
      test.skip(pmmVersion > 35, 'Test is for versions earlier 2.36.0');
      const property = await api.pmm.settingsV1.getSettingsProperty(SettingProperty.bm);
      await expect(property).toBeUndefined();
  });

  test('PMM-T1659 Verify that BM is enabled by default after upgrade in 2.36.0+' +
      ' @config-post-upgrade @config',
    async ({}) => {
      test.skip(pmmVersion <= 36, 'Test is for versions 2.36.0+');
      const property = await api.pmm.settingsV1.getSettingsProperty(SettingProperty.bm);
      await expect(property).toBe(true);
  });
});
