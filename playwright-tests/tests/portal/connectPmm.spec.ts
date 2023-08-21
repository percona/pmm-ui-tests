import { expect, test } from '@helpers/test-helper';
import apiHelper from '@api/helpers/api-helper';
import { portalApi } from '@api/portal.api';
import Duration from '@helpers/enums/duration';
import { PortalUser } from '@helpers/types/portal-user.class';
import { api } from '@api/api';
import { portalHelper } from '@helpers/portal-helper';

test.describe('Spec file for connecting PMM to the portal', async () => {
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
  });

  test('PMM-T809 PMM-T398 Verify Percona Platform elements on PMM Settings'
      + ' Page @portal @pre-pmm-portal-upgrade', async ({ perconaPlatformPage }) => {
    test.skip(pmmVersion < 27, 'This test is for PMM version 2.27.0 and higher');

    await test.step('1. Open Percona Platform tab in PMM Settings', async () => {
      await perconaPlatformPage.authenticateSession();
      await perconaPlatformPage.open();
    });

    await test.step('2. Verify all required element are displayed.', async () => {
      await expect(perconaPlatformPage.elements.pmmServerIdHeader)
        .toHaveText(perconaPlatformPage.labels.pmmServerId, { ignoreCase: true });
      await expect(perconaPlatformPage.elements.pmmServerNameHeader).toHaveText(perconaPlatformPage.labels.pmmServerName);
      await expect(perconaPlatformPage.elements.accessTokenHeader).toHaveText(perconaPlatformPage.labels.accessToken);
      if (pmmVersion >= 35) {
        await expect(perconaPlatformPage.buttons.createPerconaAccount).toHaveAttribute('href', perconaPlatformPage.links.portalLogin);
        await expect(perconaPlatformPage.buttons.connect).toHaveText(perconaPlatformPage.labels.validateConnection);
      } else {
        await expect(perconaPlatformPage.buttons.connect).toHaveText(perconaPlatformPage.labels.connect);
      }
      if (pmmVersion >= 35) {
        await expect(perconaPlatformPage.buttons.getToken35).toHaveAttribute('href', perconaPlatformPage.links.portalProfile);
      } else if (pmmVersion > 29 && pmmVersion < 35) {
        await expect(perconaPlatformPage.buttons.getToken).toHaveAttribute('href', perconaPlatformPage.links.portalProfile);
      } else {
        await expect(perconaPlatformPage.buttons.getToken).toHaveAttribute('href', perconaPlatformPage.links.platformProfile);
      }
    });

    await test.step('3. Verify that pmm server name and access token are required.', async () => {
      await perconaPlatformPage.fields.pmmServerName.focus();
      await perconaPlatformPage.fields.accessToken.focus();
      await perconaPlatformPage.buttons.connect.click({ force: true });
      await expect(perconaPlatformPage.elements.pmmServerNameError).toHaveText(perconaPlatformPage.labels.requiredField);
      await expect(perconaPlatformPage.elements.accessTokenError).toHaveText(perconaPlatformPage.labels.requiredField);
    });

    await test.step('4. Verify user can connect to the portal only when server name and access token are valid.', async () => {
      await perconaPlatformPage.fields.pmmServerName.type('Some Name');
      await perconaPlatformPage.fields.accessToken.type('Some Token');
      await expect(perconaPlatformPage.buttons.connect).toBeEnabled();
    });
  });

  test(
    'PMM-T1224 Verify user is notified about using old PMM version while trying to connect to Portal'
      + ' @portal @pre-pmm-portal-upgrade @post-pmm-portal-upgrade',
    async ({ perconaPlatformPage }) => {
      test.skip(pmmVersion > 26, 'This test is for PMM version 2.26.0 and lower');
      await perconaPlatformPage.authenticateSession();
      await perconaPlatformPage.open();
      await perconaPlatformPage.fields.pmmServerName.type(`Test Server ${Date.now()}`);
      await perconaPlatformPage.fields.email.type(firstAdmin.email);
      await perconaPlatformPage.fields.password.type(firstAdmin.password);
      await perconaPlatformPage.buttons.connect.click();
      await perconaPlatformPage.toast.checkToastMessage(perconaPlatformPage.messages.oldPmmVersionError);
    },
  );

  test(
    'PMM-T1097 Verify PMM server is connected to Portal'
      + ' @not-ui-pipeline @portal @pre-pmm-portal-upgrade',
    async ({ perconaPlatformPage }) => {
      test.skip(pmmVersion < 27, 'This test is for PMM version 2.27.0 and higher');

      await test.step('1. Open Percona Platform tab in PMM Settings', async () => {
        await perconaPlatformPage.authenticateSession();
        await perconaPlatformPage.open();
        await perconaPlatformPage.perconaPlatformContainer.waitFor({ state: 'visible' });
      });

      await test.step('2. Connect PMM to the Portal', async () => {
        const adminToken = await portalApi.getUserAccessToken(firstAdmin.email, firstAdmin.password);
        // pmm address is not set automatically in older PMMs.
        await perconaPlatformPage.connectToPortal(adminToken, `Test Server ${Date.now()}`, true);
      });
    },
  );

  test(
    'PMM-T1098 Verify All org users can login in connected PMM server'
      + ' @not-ui-pipeline @portal @pre-pmm-portal-upgrade @post-pmm-portal-upgrade',
    async ({
      loginPage, homeDashboardPage, baseURL, context,
    }) => {
      test.skip(pmmVersion < 27, 'This test is for PMM version 2.27.0 and higher');

      await test.step('1. Login as admin user that created the org.', async () => {
        await loginPage.open();
        await loginPage.oktaLogin(firstAdmin.email, firstAdmin.password);
        await homeDashboardPage.pmmUpgrade.containers.upgradeContainer
          .waitFor({ state: 'visible', timeout: Duration.OneMinute });
        await expect(loginPage.page).toHaveURL(`${baseURL}/${loginPage.landingUrl}`);
        await context.clearCookies();
        await loginPage.page.reload();
      });

      await test.step('1. Login as admin user that was invited to the org.', async () => {
        await loginPage.oktaLogin(secondAdmin.email, secondAdmin.password);
        await homeDashboardPage.pmmUpgrade.containers.upgradeContainer.waitFor({
          state: 'visible', timeout: Duration.OneMinute,
        });
        await expect(loginPage.page).toHaveURL(`${baseURL}/${loginPage.landingUrl}`);
        await context.clearCookies();
        await loginPage.page.reload();
      });

      await test.step('1. Login as technical user that was invited to the org.', async () => {
        await loginPage.oktaLogin(technicalUser.email, technicalUser.password);
        await homeDashboardPage.pmmUpgrade.containers.upgradeContainer
          .waitFor({ state: 'visible', timeout: Duration.OneMinute });
        await expect(loginPage.page).toHaveURL(`${baseURL}/${loginPage.landingUrl}`);
        await context.clearCookies();
        await loginPage.page.reload();
      });
    },
  );
});
