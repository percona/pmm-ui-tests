import { expect, test } from '@playwright/test';
import { fileHelper } from '../../helpers/FileHelper';
import grafanaHelper from '../../helpers/GrafanaHelper';
import PerconaPlatform from '../../pages/pmmSettings/PerconaPlatform.page';
import HomeDashboard from '../../pages/HomeDashboard.page'
import { portalAPI } from '../../api/portalApi';
import { SignInPage } from '../../pages/SignIn.page';
import { serviceNowAPI } from '../../api/serviceNowApi';
import User from '../../support/types/user.interface';
import Duration from '../../helpers/Duration';
import { PortalUserRoles } from '../../support/enums/portalUserRoles';
import apiHelper from '../../api/apiHelper';

test.describe('Spec file for connecting PMM to the portal', async () => {
  let firstAdmin: User;
  let secondAdmin: User;
  let technicalUser: User;
  let pmmVersion: number;
  const fileName = 'portalCredentials';

  test.beforeAll(async ({ baseURL }) => {
    if(!pmmVersion) {
      const versionString = (await apiHelper.getPmmVersion()).versionMinor;
      pmmVersion = parseInt(versionString)
    }
    const userCredentials = await fileHelper.readfile(fileName);
    if (userCredentials) {
      [firstAdmin, secondAdmin, technicalUser] = JSON.parse(userCredentials);
    } else {
      [firstAdmin, secondAdmin, technicalUser] = await serviceNowAPI.createServiceNowUsers();
      const adminToken = await portalAPI.getUserAccessToken(firstAdmin.email, firstAdmin.password);
      const { org } = await portalAPI.createOrg(adminToken);
      await portalAPI.inviteUserToOrg(adminToken, org.id, secondAdmin.email, PortalUserRoles.admin);
      await portalAPI.inviteUserToOrg(adminToken, org.id, technicalUser.email, PortalUserRoles.technical);
      await fileHelper.writeFileSync(fileName, JSON.stringify([firstAdmin, secondAdmin, technicalUser]));
    }
  })

  test.beforeEach(async ({page}) => {
    await apiHelper.confirmTour(page)
    await page.goto('/');
  });
/*
  test.afterAll(async () => {
    const adminToken = await portalAPI.getUserAccessToken(firstAdmin.email, firstAdmin.password);
    const org = await portalAPI.getOrg(adminToken);

    if (org.orgs.length) {
      await portalAPI.deleteOrg(adminToken, org.orgs[0].id);
    }

    await oktaAPI.deleteUsers([firstAdmin, secondAdmin, technicalUser]);
  });
*/

  test('PMM-T398 Verify Percona Platform elements on PMM Settings Page @portal @pre-pmm-portal-upgrade', async ({ page }) => {
    if (pmmVersion >= 27) {
      test.info().annotations.push({
        type: 'Also Covers',
        description: 'PMM-T809 Verify validation for Percona Platform connect form',
      });
      const platformPage = new PerconaPlatform(page);

      await test.step('1. Open Percona Platform tab in PMM Settings',async () => {
        await grafanaHelper.authorize(page);
        await page.goto(platformPage.perconaPlatformURL);
        await platformPage.perconaPlatformContainer.waitFor({state: 'visible'});
        await page.getByText(platformPage.labels.header).waitFor({state: 'visible'});  
      });

      await test.step('2. Verify all required element are displayed.',async () => {
        await expect(platformPage.elements.pmmServerIdHeader).toHaveText(platformPage.labels.pmmServerId);
        await expect(platformPage.elements.pmmServerNameHeader).toHaveText(platformPage.labels.pmmServerName);
        await expect(platformPage.elements.accessTokenHeader).toHaveText(platformPage.labels.accessToken);
        // fix address for older pmm address is not portal-dev but just portal.
        if(pmmVersion < 30) {
          await expect(platformPage.buttons.getToken).toHaveAttribute('href', platformPage.links.platformProfile);
        } else {
          await expect(platformPage.buttons.getToken).toHaveAttribute('href', platformPage.links.portalProfile);
        }
        
      });

      await test.step('3. Verify that pmm server name and access token are required.',async () => {
        await platformPage.fields.pmmServerName.focus();
        await platformPage.fields.accessToken.focus();
        await platformPage.buttons.connect.click({ force: true });
        await expect(platformPage.elements.pmmServerNameError).toHaveText(platformPage.labels.requiredField);
        await expect(platformPage.elements.accessTokenError).toHaveText(platformPage.labels.requiredField);
      });

      await test.step('4. Verify user can connect to the portal only when server name and access token are valid.',async () => {
        await platformPage.fields.pmmServerName.type('Some Name');
        await platformPage.fields.accessToken.type('Some Token');
        await expect(platformPage.buttons.connect).toBeEnabled();
      });
    } else {
      test.info().annotations.push({
        type: 'Old Version ',
        description: 'This test is for PMM version 2.27.0 and higher',
      });
    }
  });

  test('PMM-T1224 Verify user is notified about using old PMM version while trying to connect to Portal @portal @pre-pmm-portal-upgrade @post-pmm-portal-upgrade', async ({ page }) => {
    const platformPage = new PerconaPlatform(page);

    if (pmmVersion < 27) {
      await grafanaHelper.authorize(page);
      await page.goto(platformPage.perconaPlatformURL);
      await platformPage.fields.pmmServerName.type(`Test Server ${Date.now()}`)
      await platformPage.fields.email.type(firstAdmin.email);
      await platformPage.fields.password.type(firstAdmin.password);
      await platformPage.buttons.connect.click();
      await platformPage.toast.checkToastMessage(platformPage.messages.oldPmmVersionError);
    } else {
      test.info().annotations.push({
        type: 'New Version ',
        description: 'This test is for PMM version 2.26.0 and lower',
      });
    }
  });

  test('PMM-T1097 Verify PMM server is connected to Portal @not-ui-pipeline @portal @pre-pmm-portal-upgrade', async ({ page }) => {
    if (pmmVersion >= 27) {
      const platformPage = new PerconaPlatform(page);

      await test.step('1. Open Percona Platform tab in PMM Settings',async () => {
        await grafanaHelper.authorize(page);
        await page.goto(platformPage.perconaPlatformURL);
        await platformPage.perconaPlatformContainer.waitFor({state: 'visible'});
      });

      await test.step('2. Connect PMM to the Portal',async () => {
        const adminToken = await portalAPI.getUserAccessToken(firstAdmin.email, firstAdmin.password);
        // pmm address is not set automatically in older pmms.
        await platformPage.connectToPortal(adminToken, `Test Server ${Date.now()}`, true);
      });
    } else {
      test.info().annotations.push({
        type: 'Old Version ',
        description: 'This test is for PMM version 2.27.0 and higher',
      });
    }
  });

  test('PMM-T1098 Verify All org users can login in connected PMM server @not-ui-pipeline @portal @pre-pmm-portal-upgrade @post-pmm-portal-upgrade', async ({ page, baseURL, context, browser }) => {
    if (pmmVersion >= 27) {
      const signInPage = new SignInPage(page);
      const homeDashboard = new HomeDashboard(page);

      await test.step('1. Login as admin user that created the org.',async () => {
        await signInPage.oktaLogin(firstAdmin.email, firstAdmin.password);
        await homeDashboard.pmmUpgrade.elements.currentVersion.waitFor({ state: 'visible', timeout: Duration.ThreeMinutes });
        await expect(page).toHaveURL(`${baseURL}/${signInPage.landingUrl}`);
        await context.clearCookies();  
      });

      await test.step('1. Login as admin user that was invited to the org.',async () => {
        await signInPage.oktaLogin(secondAdmin.email, secondAdmin.password);
        await homeDashboard.pmmUpgrade.elements.currentVersion.waitFor({ state: 'visible', timeout: Duration.ThreeMinutes });
        await expect(page).toHaveURL(`${baseURL}/${signInPage.landingUrl}`);
        await context.clearCookies();
      });
    
      await test.step('1. Login as technical user that was invited to the org.',async () => {
        await signInPage.oktaLogin(technicalUser.email, technicalUser.password);
        await homeDashboard.pmmUpgrade.elements.currentVersion.waitFor({ state: 'visible', timeout: Duration.ThreeMinutes });
        await expect(page).toHaveURL(`${baseURL}/${signInPage.landingUrl}`);
        await context.clearCookies();
      });
    } else {
      test.info().annotations.push({
        type: 'Old Version ',
        description: 'This test is for PMM version 2.27.0 and higher',
      });
    };
  });
});
