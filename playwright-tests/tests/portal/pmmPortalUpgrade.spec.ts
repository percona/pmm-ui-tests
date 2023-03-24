import { expect, test } from '@playwright/test';
import User from '@support/types/user.interface';
import apiHelper from '@api/helpers/apiHelper';
import { fileHelper } from '@helpers/FileHelper';
import { portalAPI } from '@api/portalApi';
import { serviceNowAPI } from '@api/serviceNowApi';
import { PortalUserRoles } from '@support/enums/portalUserRoles';
import Duration from '@helpers/Duration';
import HomeDashboard from '@pages/HomeDashboard.page';
import grafanaHelper from '@helpers/GrafanaHelper';
import { oktaAPI } from '@api/okta';
import {v1} from "@api/v1";

test.describe('Spec file for PMM connected the portal', async () => {
  test.describe.configure({ retries: 0 });
  let firstAdmin: User;
  let secondAdmin: User;
  let technicalUser: User;
  let freeUser: User;
  let pmmVersion: number;
  const fileName = 'portalCredentials';
  let orgId;

  test.beforeAll(async () => {
    if (!pmmVersion) {
      const versionString = (await apiHelper.getPmmVersion()).versionMinor;
      pmmVersion = parseInt(versionString);
    }
    const userCredentials = await fileHelper.readfile(fileName);
    let adminToken: string;
    if (userCredentials) {
      [firstAdmin, secondAdmin, technicalUser] = JSON.parse(userCredentials);
      adminToken = await portalAPI.getUserAccessToken(firstAdmin.email, firstAdmin.password);
      orgId = (await portalAPI.getOrg(adminToken)).orgs[0].id;
    } else {
      [firstAdmin, secondAdmin, technicalUser] = await serviceNowAPI.createServiceNowUsers();
      adminToken = await portalAPI.getUserAccessToken(firstAdmin.email, firstAdmin.password);
      let { org } = await portalAPI.createOrg(adminToken);
      orgId = org.id;
      await portalAPI.inviteUserToOrg(adminToken, org.id, secondAdmin.email, PortalUserRoles.admin);
      await portalAPI.inviteUserToOrg(adminToken, org.id, technicalUser.email, PortalUserRoles.technical);
      await fileHelper.writeFileSync(fileName, JSON.stringify([firstAdmin, secondAdmin, technicalUser]));
    }
    freeUser = await oktaAPI.createTestUser();
    await portalAPI.inviteUserToOrg(adminToken, orgId, freeUser.email, PortalUserRoles.admin);
  });

  test.beforeEach(async ({ page }) => {
    await v1.confirmTour(page);
    await page.goto('');
  });

  test('Verify user is able to Upgrade PMM version @not-ui-pipeline @pmm-portal-upgrade', async ({ page }) => {
    test.setTimeout(Duration.TwentyMinutes);
    const homeDashboard = new HomeDashboard(page);

    await grafanaHelper.authorize(page);
    await homeDashboard.pmmUpgrade.elements.currentVersion.waitFor({ state: 'visible', timeout: Duration.ThreeMinutes });

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
