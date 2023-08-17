import { expect, test } from '@playwright/test';
import { apiHelper } from '@api/helpers/apiHelper';
import { portalAPI } from '@api/portalApi';
import Duration from '@helpers/enums/Duration';
import grafanaHelper from '@helpers/grafanaHelper';
import HomeDashboard from '@pages/HomeDashboard.page';
import PerconaPlatform from '@pages/pmmSettings/PerconaPlatform.page';
import { SignInPage } from '@pages/SignIn.page';
import { PortalUser } from '@helpers/types/PortalUser';
import { api } from '@api/api';
import { portalHelper } from '@helpers/portalHelper';

test.describe('Spec file for connecting PMM to the portal', async () => {
  test.describe.configure({ retries: 0 });
  let pmmVersion: number;
  let firstAdmin: PortalUser;
  let secondAdmin: PortalUser;
  let technicalUser: PortalUser;

  test.beforeAll(async () => {
    pmmVersion = (await api.pmm.serverV1.getPmmVersion()).minor;
    [firstAdmin, secondAdmin, technicalUser] = portalHelper.loadUsersFromFile();
  });

  test.beforeEach(async ({ page }) => {
    await apiHelper.confirmTour(page);
    await page.goto('/');
  });

  test('PMM-T809 PMM-T398 Verify Percona Platform elements on PMM Settings Page @portal @pre-pmm-portal-upgrade', async ({ page }) => {
    test.skip(pmmVersion < 27, 'This test is for PMM version 2.27.0 and higher');
    const platformPage = new PerconaPlatform(page);

    await test.step('1. Open Percona Platform tab in PMM Settings', async () => {
      await grafanaHelper.authorize(page);
      await page.goto(platformPage.perconaPlatformURL);
      await expect(platformPage.perconaPlatformContainer).toBeVisible();

      if (pmmVersion >= 35) {
        await expect(platformPage.elements.header_2_35).toBeVisible();
      } else {
        // TODO: find out what works best .waitFor of expect
        await page.getByText(platformPage.labels.header).waitFor({
          state: 'visible',
        });
      }
    });

    await test.step('2. Verify all required element are displayed.', async () => {
      if (pmmVersion >= 35) {
        await expect(platformPage.elements.pmmServerIdHeader).toHaveText(platformPage.labels.pmmServerId_35);
      } else {
        await expect(platformPage.elements.pmmServerIdHeader).toHaveText(platformPage.labels.pmmServerId);
      }

      await expect(platformPage.elements.pmmServerNameHeader).toHaveText(platformPage.labels.pmmServerName);
      await expect(platformPage.elements.accessTokenHeader).toHaveText(platformPage.labels.accessToken);
      if (pmmVersion >= 35) {
        await expect(platformPage.buttons.createPerconaAccount).toHaveAttribute('href', platformPage.links.portalLogin);
        await expect(platformPage.buttons.connect).toHaveText(platformPage.labels.validateConnection);
      } else {
        await expect(platformPage.buttons.connect).toHaveText(platformPage.labels.connect);
      }

      if (pmmVersion >= 35) {
        await expect(platformPage.buttons.getToken35).toHaveAttribute('href', platformPage.links.portalProfile);
      } else if (pmmVersion > 29 && pmmVersion < 35) {
        await expect(platformPage.buttons.getToken).toHaveAttribute('href', platformPage.links.portalProfile);
      } else {
        await expect(platformPage.buttons.getToken).toHaveAttribute('href', platformPage.links.platformProfile);
      }
    });

    await test.step('3. Verify that pmm server name and access token are required.', async () => {
      await platformPage.fields.pmmServerName.focus();
      await platformPage.fields.accessToken.focus();
      await platformPage.buttons.connect.click({
        force: true,
      });
      await expect(platformPage.elements.pmmServerNameError).toHaveText(platformPage.labels.requiredField);
      await expect(platformPage.elements.accessTokenError).toHaveText(platformPage.labels.requiredField);
    });

    await test.step('4. Verify user can connect to the portal only when server name and access token are valid.', async () => {
      await platformPage.fields.pmmServerName.type('Some Name');
      await platformPage.fields.accessToken.type('Some Token');
      await expect(platformPage.buttons.connect).toBeEnabled();
    });
  });

  test('PMM-T1224 Verify user is notified about using old PMM version while trying to connect to Portal @portal @pre-pmm-portal-upgrade @post-pmm-portal-upgrade', async ({ page }) => {
    test.skip(pmmVersion > 26, 'This test is for PMM version 2.26.0 and lower');
    const platformPage = new PerconaPlatform(page);

    await grafanaHelper.authorize(page);
    await page.goto(platformPage.perconaPlatformURL);
    await platformPage.fields.pmmServerName.type(`Test Server ${Date.now()}`);
    await platformPage.fields.email.type(firstAdmin.email);
    await platformPage.fields.password.type(firstAdmin.password);
    await platformPage.buttons.connect.click();
    await platformPage.toast.checkToastMessage(platformPage.messages.oldPmmVersionError);
  });

  test('PMM-T1097 Verify PMM server is connected to Portal @not-ui-pipeline @portal @pre-pmm-portal-upgrade', async ({ page }) => {
    test.skip(pmmVersion < 27, 'This test is for PMM version 2.27.0 and higher');
    const platformPage = new PerconaPlatform(page);

    await test.step('1. Open Percona Platform tab in PMM Settings', async () => {
      await grafanaHelper.authorize(page);
      await page.goto(platformPage.perconaPlatformURL);
      await platformPage.perconaPlatformContainer.waitFor({
        state: 'visible',
      });
    });

    await test.step('2. Connect PMM to the Portal', async () => {
      const adminToken = await portalAPI.getUserAccessToken(firstAdmin.email, firstAdmin.password);

      // pmm address is not set automatically in older pmms.
      await platformPage.connectToPortal(adminToken, `Test Server ${Date.now()}`, true);
    });
  });

  test('PMM-T1098 Verify All org users can login in connected PMM server @not-ui-pipeline @portal @pre-pmm-portal-upgrade @post-pmm-portal-upgrade', async ({
    page,
    baseURL,
    context,
  }) => {
    test.skip(pmmVersion < 27, 'This test is for PMM version 2.27.0 and higher');
    const signInPage = new SignInPage(page);
    const homeDashboard = new HomeDashboard(page);

    await test.step('1. Login as admin user that created the org.', async () => {
      await signInPage.oktaLogin(firstAdmin.email, firstAdmin.password);
      await homeDashboard.pmmUpgrade.containers.upgradeContainer.waitFor({
        state: 'visible', timeout: Duration.OneMinute,
      });
      await expect(page).toHaveURL(`${baseURL}/${signInPage.landingUrl}`);
      await context.clearCookies();
      await page.reload();
    });

    await test.step('1. Login as admin user that was invited to the org.', async () => {
      await signInPage.oktaLogin(secondAdmin.email, secondAdmin.password);
      await homeDashboard.pmmUpgrade.containers.upgradeContainer.waitFor({
        state: 'visible', timeout: Duration.OneMinute,
      });
      await expect(page).toHaveURL(`${baseURL}/${signInPage.landingUrl}`);
      await context.clearCookies();
      await page.reload();
    });

    await test.step('1. Login as technical user that was invited to the org.', async () => {
      await signInPage.oktaLogin(technicalUser.email, technicalUser.password);
      await homeDashboard.pmmUpgrade.containers.upgradeContainer.waitFor({
        state: 'visible', timeout: Duration.OneMinute,
      });
      await expect(page).toHaveURL(`${baseURL}/${signInPage.landingUrl}`);
      await context.clearCookies();
      await page.reload();
    });
  });
});
