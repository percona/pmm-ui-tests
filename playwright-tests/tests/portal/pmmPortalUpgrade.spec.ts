import { test } from '@playwright/test';
import { PortalUser } from '@helpers/types/PortalUser';
import { apiHelper } from '@api/helpers/apiHelper';
import { fileHelper } from '@helpers/fileHelper';
import { portalAPI } from '@api/portalApi';
import { serviceNowAPI } from '@api/serviceNowApi';
import { PortalUserRoles } from '@helpers/enums/portalUserRoles';
import Duration from '@helpers/enums/Duration';
import HomeDashboard from '@pages/HomeDashboard.page';
import grafanaHelper from '@helpers/grafanaHelper';
import { okta } from '@api/okta';
import { api } from '@api/api';
import {portalHelper} from "@helpers/portalHelper";

test.describe('Spec file for PMM connected the portal', async () => {
  test.describe.configure({
    retries: 0,
  });
  let firstAdmin: PortalUser;
  let secondAdmin: PortalUser;
  let technicalUser: PortalUser;
  let freeUser: PortalUser;
  let pmmVersion: number;
  const fileName = 'portalCredentials';
  let orgId: string;

  test.beforeAll(async () => {
    if (!pmmVersion) {
      pmmVersion = (await api.pmm.serverV1.getPmmVersion()).minor;
    }
    [firstAdmin, secondAdmin, technicalUser] = await portalHelper.loadTestUsers();

    freeUser = await okta.createTestUser();
    // await portalAPI.inviteUserToOrg(adminToken, orgId, freeUser.email, PortalUserRoles.admin);
  });

  test.beforeEach(async ({ page }) => {
    await apiHelper.confirmTour(page);
    await page.goto('');
  });

  test('Verify user is able to Upgrade PMM version @not-ui-pipeline @pmm-portal-upgrade', async ({ page }) => {
    test.setTimeout(Duration.TwentyMinutes);
    const homeDashboard = new HomeDashboard(page);

    await grafanaHelper.authorize(page);
    await homeDashboard.pmmUpgrade.elements.currentVersion.waitFor({
      state: 'visible', timeout: Duration.ThreeMinutes,
    });

    const currentVersion = await homeDashboard.pmmUpgrade.elements.currentVersion.textContent();
    const availableVersion = await homeDashboard.pmmUpgrade.elements.availableVersion.textContent();

    console.log(`Upgrading PMM from the version: ${currentVersion} to the version: ${availableVersion}.`);

    test.info().annotations.push({
      type: 'Test Details',
      description: `Upgrading PMM from the version: ${currentVersion} to the version: ${availableVersion}`,
    });

    await homeDashboard.upgradePMM();
  });
});
