import { expect, test } from '@playwright/test';
import User from '../../support/types/user.interface';
import { fileHelper } from '../../helpers/FileHelper';
import { serviceNowAPI } from '../../api/serviceNowApi';
import { portalAPI } from '../../api/portalApi';
import { PortalUserRoles } from '../../support/enums/portalUserRoles';
import apiHelper from '../../helpers/apiHelper';
import HomeDashboard from '../../pages/HomeDashboard.page';
import { SignInPage } from '../../pages/SignIn.page';
import Duration from '../../helpers/Duration';
import TicketsPage from '../../pages/platformPages/Tickets.page';
import grafanaHelper from '../../helpers/GrafanaHelper';
import { oktaAPI } from '../../api/okta';

test.describe('Spec file for PMM connected the portal', async () => {
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
    let adminToken;
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
  
  test('PMM-T1132 Verify PMM user logged in using SSO and member of SN account is able to see tickets @not-ui-pipeline @portal @post-pmm-portal-upgrade', async ({ page, context }) => {
    const signInPage = new SignInPage(page);
    const homeDashboard = new HomeDashboard(page);
    const ticketsPage = new TicketsPage(page);

    await test.step('1. Login to he connected pmm with SSO',async () => {
      await signInPage.oktaLogin(firstAdmin.email, firstAdmin.password);
      await homeDashboard.pmmUpgrade.elements.currentVersion.waitFor({ state: 'visible', timeout: Duration.ThreeMinutes });
    });

    await test.step('2. Verify that there is a side menu for organizational tickets',async () => {
      await homeDashboard.sideMenu.elements.tickets.click();
    });

    await test.step('3. Verify user can see tickets for his org.',async () => {
      await ticketsPage.elements.table.waitFor({state: 'visible'});
      await expect(ticketsPage.elements.rows).toHaveCount(1);
      const [newPage] = await Promise.all([
        context.waitForEvent('page'),
        ticketsPage.elements.row(0).click(),
      ]);
      await newPage.getByRole('form').waitFor({ state:'visible' });
      expect(newPage.url()).toContain(ticketsPage.serviceNowUrl);
      await newPage.close();
    });
  });

  test('PMM-T1147 Verify PMM user that is not logged in with SSO can NOT see Tickets for organization @not-ui-pipeline @portal @post-pmm-portal-upgrade', async ({ page, context }) => {
    const homeDashboard = new HomeDashboard(page);
    const ticketsPage = new TicketsPage(page);

    await grafanaHelper.authorize(page);
    await homeDashboard.pmmUpgrade.elements.currentVersion.waitFor({ state: 'visible', timeout: Duration.ThreeMinutes });
    if(!pmmVersion) {
      const versionString = (await homeDashboard.pmmUpgrade.getCurrentPMMVersion()).versionMinor;
      pmmVersion = parseInt(versionString)
    }
    await homeDashboard.sideMenu.elements.tickets.waitFor({ state: 'detached' });
    await page.goto(ticketsPage.ticketsUrl);
    if (pmmVersion >= 28) {
      await expect(ticketsPage.elements.notPlatformUser).toHaveText(ticketsPage.messages.loginWithPercona);
    } else {
      await expect(ticketsPage.elements.emptyBlock).toHaveText(ticketsPage.messages.notConnectedToThePortal);
    } 
  });

  test('PMM-T1148 Verify PMM user logged in using SSO and member of organization in Portal BUT not a SN account is NOT able to see Tickets @not-ui-pipeline @portal @post-pmm-portal-upgrade', async ({ page }) => { 
    const signInPage = new SignInPage(page);
    const homeDashboard = new HomeDashboard(page);
    const ticketsPage = new TicketsPage(page);

    await signInPage.oktaLogin(freeUser.email, freeUser.password);
    await homeDashboard.pmmUpgrade.elements.currentVersion.waitFor({ state: 'visible', timeout: Duration.ThreeMinutes });
    await homeDashboard.sideMenu.elements.tickets.click();
    await expect(ticketsPage.elements.noDataTable).toHaveText(ticketsPage.messages.noTicketsFound);
  });
});
