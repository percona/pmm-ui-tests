import { expect, test } from '@playwright/test';
import { api } from '@tests/api/api';
import apiHelper from '@tests/api/helpers/apiHelper';
import { oktaAPI } from '@tests/api/okta';
import { portalAPI } from '@tests/api/portalApi';
import Duration from '@tests/helpers/Duration';
import grafanaHelper from '@tests/helpers/GrafanaHelper';
import HomeDashboard from '@tests/pages/HomeDashboard.page';
import { SignInPage } from '@tests/pages/SignIn.page';
import { AdvisorInsights } from '@tests/pages/advisors/AdvisorInsights.page';
import { ConfigurationAdvisors } from '@tests/pages/advisors/ConfigurationAdvisors.page';
import config from '@tests/playwright.config';
import User from '@tests/support/types/user.interface';

test.describe('Spec file for basic database version control of Advisors. ', async () => {
  let freePlatformUser: User;
  let freeUserToken: string;
  let freeOrg: any;
  let numberOfAdvisorsNonRegistered: number;
  let numberOfAdvisorsRegistered: number;
  let numberOfAdvisorsPaid: number;

  test.beforeAll(async ({ baseURL }) => {
    freePlatformUser = await oktaAPI.createTestUser();
    freeUserToken = await portalAPI.getUserAccessToken(freePlatformUser.email, freePlatformUser.password)
    freeOrg = (await portalAPI.createOrg(freeUserToken)).org;
    await api.pmm.settingsV1.changeSettings({ pmm_public_address: baseURL!.replace(/(^\w+:|^)\/\//, '') });
    console.log(freePlatformUser);
  });

  test.beforeEach(async ({ page }) => {
    await apiHelper.confirmTour(page);
    await grafanaHelper.authorize(page, 'admin', 'admin');
    await page.goto('');
  });

  test.afterAll(async () => {
    await portalAPI.deleteOrg(await portalAPI.getUserAccessToken(freePlatformUser.email, freePlatformUser.password), freeOrg.id);
    await oktaAPI.deleteUserByEmail(freePlatformUser.email);
  });

  test('PMM-T1631 Verify integrity of the new Advisors PoC @advisors', async ({ page }) => {
    const configurationAdvisors = new ConfigurationAdvisors(page);
    const advisorInsights = new AdvisorInsights(page);
    const homeDashboard = new HomeDashboard(page);
    const signInPage = new SignInPage(page);

    await test.step('1. Login and run advisors check', async () => {
      await page.goto(configurationAdvisors.url);
      await configurationAdvisors.buttons.runChecks.click();
      await configurationAdvisors.toast.checkToastMessageContains(configurationAdvisors.messages.advisorsRunning, { variant: 'success' });
    });

    await test.step('2. Verify that check passed with results.', async () => {
      await configurationAdvisors.buttons.advisorInsights.click();

      await advisorInsights.insightsTable.waitForWarningAdvisorsDisplayed(1);
      await expect(advisorInsights.insightsTable.elements.warningAdvisor.first()).toBeVisible();

      await advisorInsights.insightsTable.waitForNoticeAdvisorsDisplayed(3);
      await expect(advisorInsights.insightsTable.elements.noticeAdvisor.first()).toBeVisible();
    });

    await test.step('3. Verify that failed advisors are displayed on home dashboard.', async () => {
      await advisorInsights.sideMenu.elements.home.click();
      await homeDashboard.verifyFailedAdvisorsStatus({ warning: 1, notice: 3 })
    });

    await test.step('4. Verify that advisors link from home dashboard links to advisors page.', async () => {
      await homeDashboard.elements.failedAdvisorsPanel.advisorLink.click();
      await expect(page).toHaveURL(`${config.use?.baseURL}/${advisorInsights.url}`);
      numberOfAdvisorsNonRegistered = await configurationAdvisors.getNumberOfAllAvailableAdvisors();
    });

    await test.step('5. Login as free registered platform user.', async () => {
      await api.pmm.platformV1.connect('Test Server', freeUserToken);
      await page.waitForTimeout(3000);
      await grafanaHelper.unAuthorize(page);
      await signInPage.oktaLogin(freePlatformUser.email, freePlatformUser.password)
    });

    await test.step('6. re-run advisors check', async () => {
      await page.goto(configurationAdvisors.url);
      await configurationAdvisors.buttons.runChecks.click();
      await configurationAdvisors.toast.checkToastMessageContains(configurationAdvisors.messages.advisorsRunning, { variant: 'success' });
      numberOfAdvisorsRegistered = await configurationAdvisors.getNumberOfAllAvailableAdvisors();
      expect(numberOfAdvisorsRegistered).toBeGreaterThan(numberOfAdvisorsNonRegistered);
    });

    await test.step('7. Verify that check passed with results.', async () => {
      await configurationAdvisors.buttons.advisorInsights.click();
      await advisorInsights.insightsTable.waitForWarningAdvisorsDisplayed(2);
      await advisorInsights.insightsTable.waitForNoticeAdvisorsDisplayed(4);
    });

    await test.step('8. Verify that failed advisors are displayed on home dashboard for registered user.', async () => {
      await advisorInsights.sideMenu.elements.home.click();
      await homeDashboard.verifyFailedAdvisorsStatus({ warning: 9, notice: 10 })
    });
  });
});
