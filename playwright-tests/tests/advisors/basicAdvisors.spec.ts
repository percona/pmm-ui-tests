import { expect, test } from '@playwright/test';
import apiHelper from '@tests/api/apiHelper';
import grafanaHelper from '@tests/helpers/GrafanaHelper';
import { AdvisorInsights } from '@tests/pages/advisors/AdvisorInsights.page';
import { ConfigurationAdvisors } from '@tests/pages/advisors/ConfigurationAdvisors.page';

test.describe('Spec file for basic database version control of Advisors. ', async () => {

  test.beforeEach(async ({ page }) => {
    await apiHelper.confirmTour(page);
    await grafanaHelper.authorize(page, 'admin', 'admin');
    await page.goto('');
  })

  test('Test 001 @advisors', async ({ page }) => {
    const configurationAdvisors = new ConfigurationAdvisors(page);
    const advisorInsights = new AdvisorInsights(page);

    await test.step('1. Navigate to the advisors page and run advisor for pgsql version', async () => {
      await page.goto(configurationAdvisors.url);
      await configurationAdvisors.elements.configurationVersions.click();
      await configurationAdvisors.buttons.runAdvisor(configurationAdvisors.labels.pgsqlVersionDescription).click();
      await configurationAdvisors.toast.checkToastMessage(
        configurationAdvisors.messages.advisorRunningBackground(
          configurationAdvisors.labels.pgsqlVersionDescription),
        { variant: 'success' }
      );
    });

    await test.step('2. Verify That failed advisor is displayed.', async () => {
      await configurationAdvisors.buttons.advisorInsights.click();
      await advisorInsights.waitForServiceDisplayed('pdpgsql-integration');
      await advisorInsights.elements.selectService('pdpgsql-integration').click();
      await expect(advisorInsights.elements.failedAdvisorRow(advisorInsights.labels.pgsqlVersion)).toBeVisible();
    });
  });
});
