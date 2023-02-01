import { expect, test } from '@playwright/test';
import User from '../../support/types/user.interface';
import { fileHelper } from '../../helpers/FileHelper';
import { serviceNowAPI } from '../../api/serviceNowApi';
import { portalAPI } from '../../api/portalApi';
import { PortalUserRoles } from '../../support/enums/portalUserRoles';
import apiHelper from '../../api/apiHelper';
import { oktaAPI } from '../../api/okta';
import grafanaHelper from '../../helpers/GrafanaHelper';
import HomeDashboard from '../../pages/HomeDashboard.page';
import Duration from '../../helpers/Duration';

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
    if(!pmmVersion) {
      const versionString = (await apiHelper.getPmmVersion()).versionMinor;
      pmmVersion = parseInt(versionString)
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
      orgId = org.id
      await portalAPI.inviteUserToOrg(adminToken, org.id, secondAdmin.email, PortalUserRoles.admin);
      await portalAPI.inviteUserToOrg(adminToken, org.id, technicalUser.email, PortalUserRoles.technical);
      await fileHelper.writeFileSync(fileName, JSON.stringify([firstAdmin, secondAdmin, technicalUser]));
    }
    freeUser = await oktaAPI.createTestUser();
    await portalAPI.inviteUserToOrg(adminToken, orgId, freeUser.email, PortalUserRoles.admin);
  })

  test.beforeEach(async ({page}) => {
    await apiHelper.confirmTour(page);
    await page.goto('');
  });

  test('Verify user is able to Upgrade PMM version @not-ui-pipeline @pmm-portal-upgrade', async ({ page }) => {
    test.setTimeout(Duration.TwentyMinutes);
    const homeDashboard = new HomeDashboard(page);

    await grafanaHelper.authorize(page);
    await homeDashboard.pmmUpgrade.elements.currentVersion.waitFor({ state: 'visible', timeout: Duration.ThreeMinutes });

    const currentVersion = await homeDashboard.pmmUpgrade.elements.currentVersion.textContent();
    const availableVersion = await homeDashboard.pmmUpgrade.elements.availableVersion.textContent();

    test.info().annotations.push({
      type: 'Test Details',
      description: `Upgrading PMM from the version: ${currentVersion} to the version: ${availableVersion}`,
    });

    await homeDashboard.upgradePMM();

  });

  test('Verify user roles are untouched after PMM server upgrade @not-ui-pipeline @portal @post-pmm-portal-upgrade', async () => {
    const users = await apiHelper.listOrgUsers()
    const foundAdmin1User = users.find((user) => user.email === firstAdmin.email);
    const foundAdmin2User = users.find((user) => user.email === secondAdmin.email);
    const foundTechnicalUser = users.find((user) => user.email === technicalUser.email);

    expect(foundAdmin1User.role).toEqual('Admin');
    expect(foundAdmin2User.role).toEqual('Admin');
    expect(foundTechnicalUser.role).toEqual('Viewer');
  });
});