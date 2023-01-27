import { expect, test } from '@playwright/test';
import apiHelper from '../../helpers/apiHelper';
import { fileHelper } from '../../helpers/FileHelper';
import grafanaHelper from '../../helpers/GrafanaHelper';
import PerconaPlatform from '../../pages/pmmSettings/PerconaPlatform.page';
import HomeDashboard from '../../pages/HomeDashboard.page'
import { portalAPI } from '../../api/portalApi';

test.describe('Spec file for Sign Up tests', async () => {
  let pmmVersion: number;
  const fileName = 'portalCredentials';

  test.beforeEach(async ({page}) => {
    const homeDashboard = new HomeDashboard(page);
    await grafanaHelper.authorize(page);
    await apiHelper.confirmTour(page);
    await page.goto('');
    if(!pmmVersion) {
      const versionString = (await homeDashboard.pmmUpgrade.getCurrentPMMVersion()).versionMinor;
      pmmVersion = parseInt(versionString)
    }
  });


  test('PMM-T398 Verify Percona Platform elements on PMM Settings Page @portal @pre-pmm-portal-upgrade', async ({ page }) => {
    if (pmmVersion >= 27) {
      test.info().annotations.push({
        type: 'Also Covers',
        description: 'PMM-T809 Verify validation for Percona Platform connect form',
      });
      const platformPage = new PerconaPlatform(page);

      await test.step('1. Open Percona Platform tab in PMM Settings',async () => {
        await page.goto(platformPage.perconaPlatformURL);
        await platformPage.perconaPlatformContainer.waitFor({state: 'visible'});
        await page.getByText(platformPage.platformLabels.header).waitFor({state: 'visible'});  
      });

      await test.step('2. Verify all required element are displayed.',async () => {
        await expect(platformPage.platformElements.pmmServerIdHeader).toHaveText(platformPage.platformLabels.pmmServerId);
        await expect(platformPage.platformElements.pmmServerNameHeader).toHaveText(platformPage.platformLabels.pmmServerName);
        await expect(platformPage.platformElements.accessTokenHeader).toHaveText(platformPage.platformLabels.accessToken);
        await expect(platformPage.platformButtons.getToken).toHaveAttribute('href', platformPage.platformLinks.getToken);
      });

      await test.step('3. Verify that pmm server name and access token are required.',async () => {
        await platformPage.platformFields.pmmServerName.focus();
        await platformPage.platformFields.accessToken.focus();
        await platformPage.platformButtons.connect.click({ force: true });
        await expect(platformPage.platformElements.pmmServerNameError).toHaveText(platformPage.platformLabels.requiredField);
        await expect(platformPage.platformElements.accessTokenError).toHaveText(platformPage.platformLabels.requiredField);
      });

      await test.step('4. Verify user can connect to the portal only when server name and access token are valid.',async () => {
        await platformPage.platformFields.pmmServerName.type('Some Name');
        await platformPage.platformFields.accessToken.type('Some Token');
        await expect(platformPage.platformButtons.connect).toBeEnabled();
      });
    } else {
      test.info().annotations.push({
        type: 'Old Version ',
        description: 'This test is for PMM version 2.27.0 and higher',
      });
    }
  });

  test('PMM-T1097 Verify PMM server is connected to Portal @not-ui-pipeline @portal @pre-pmm-portal-upgrade', async ({ page }) => {
    if (pmmVersion >= 27) {
      const platformPage = new PerconaPlatform(page);

      await test.step('1. Open Percona Platform tab in PMM Settings',async () => {
        await page.goto(platformPage.perconaPlatformURL);
        await platformPage.perconaPlatformContainer.waitFor({state: 'visible'});
      });

      await test.step('2. Connect PMM to the Portal',async () => {
        const adminToken = await portalAPI.getUserAccessToken('', '');
        await platformPage.connectToPortal(adminToken, `Test Server ${Date.now()}`);
      });
    } else {
      test.info().annotations.push({
        type: 'Old Version ',
        description: 'This test is for PMM version 2.27.0 and higher',
      });
    }
  });
});
