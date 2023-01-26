import { expect, test } from '@playwright/test';
import apiHelper from '../../helpers/apiHelper';
import { fileHelper } from '../../helpers/FileHelper';
import grafanaHelper from '../../helpers/GrafanaHelper';
import PerconaPlatform from '../../pages/pmmSettings/PerconaPlatform.page';
import HomeDashboard from '../../pages/HomeDashboard.page'

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


  test('PMM-T398 PMM-T809 Verify Connect to Percona Portal elements @portal @pre-pmm-portal-upgrade', async ({ page }) => {
    if (pmmVersion >= 27) {
      const platformPage = new PerconaPlatform(page);

      await page.goto(platformPage.perconaPlatformURL);
      await platformPage.perconaPlatformContainer.waitFor({state: 'visible'});
      await page.getByText(platformPage.platformLabels.header).waitFor({state: 'visible'});
  
      await expect(platformPage.platformElements.pmmServerIdHeader).toHaveText(platformPage.platformLabels.pmmServerId);
      await expect(platformPage.platformElements.pmmServerNameHeader).toHaveText(platformPage.platformLabels.pmmServerName);
      await expect(platformPage.platformElements.accessTokenHeader).toHaveText(platformPage.platformLabels.accessToken);
      await expect(platformPage.platformButtons.getToken).toHaveAttribute('href', platformPage.platformLinks.getToken);

      await platformPage.platformFields.pmmServerName.focus();
      await platformPage.platformFields.accessToken.focus();
      await platformPage.platformButtons.connect.click({ force: true });
      await expect(platformPage.platformElements.pmmServerNameError).toHaveText(platformPage.platformLabels.requiredField);
      await expect(platformPage.platformElements.accessTokenError).toHaveText(platformPage.platformLabels.requiredField);

      await platformPage.platformFields.pmmServerName.type('Some Name');
      await platformPage.platformFields.accessToken.type('Some Token');
      await expect(platformPage.platformButtons.connect).toBeEnabled();
    }
  });


});