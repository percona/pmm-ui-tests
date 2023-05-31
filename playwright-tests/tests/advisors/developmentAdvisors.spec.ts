import { Page, expect, test } from '@playwright/test';
import Duration from '@tests/helpers/Duration';
import { AdvisorInsights, FailedAdvisorType } from './pages/AdvisorInsights.page';
import { ConfigurationAdvisors } from './pages/ConfigurationAdvisors.page';
import { DevelopmentAdvisors } from './pages/DevelopmentAdvisors.page';
import apiHelper from '@tests/api/helpers/apiHelper';
import grafanaHelper from '@tests/helpers/GrafanaHelper';
import { MySqlDashboard } from '@tests/pages/dashboards/mysql/MySqlDashboard.page';

test.describe('Spec file for Development Advisors. ', async () => {

  test.beforeEach(async ({ page }, testInfo) => {
    await apiHelper.confirmTour(page);
    await grafanaHelper.authorize(page);
    await page.goto('');
  });

  test('PMM-T1645 Verify integrity of the new Advisors : Verify that Clickhouse as a DataSource is detect by QAN @developmentAdvisors', async ({ page, context, browser }) => {
    const developmentAdvisors = new DevelopmentAdvisors(page);

    await test.step('1. Verify that check file was properly loaded to Advisors', async () => {
      await page.goto(developmentAdvisors.url);
      await developmentAdvisors.elements.advisorsCategoryCollapse.click()
      await developmentAdvisors.advisorsTable.verifyTableDoesContain('Sample Clickhouse advisor that checks if QAN is on a MongoDB instance');
    })
  });

  test('PMM-T1689 Verify Advisors : MongoDB replica sets Actions executed always on the corresponding node @developmentAdvisors', async ({ page }) => {
    let advisorInsights = new AdvisorInsights(page);
    const advisorName = 'Check that advisor hits proper service';

    await test.step('1. Login and run advisor check for mongo db replica set.', async () => {
      await page.goto(advisorInsights.url);
      await advisorInsights.buttons.developmentAdvisors.click();
      await advisorInsights.openAllCategoryCollapseElements();
      await advisorInsights.buttons.runAdvisor(advisorName).click();
      await advisorInsights.toast.checkToastMessage(advisorInsights.messages.advisorRunning(advisorName), { variant: 'success' });
    });

    await test.step('2. Verify that check for the first node is executed on the first node.', async () => {
      const serviceName = 'mo-replica-integration-0';
      await advisorInsights.buttons.advisorInsights.click();
      await advisorInsights.verifyFailedAdvisorsForServiceAndType(serviceName, FailedAdvisorType.Notice, 1, Duration.ThreeMinutes);
      await advisorInsights.elements.failedAdvisorRow(serviceName).click();
      await advisorInsights.failedChecksTable.elements.showDetails('test_check').click();
      await expect(advisorInsights.failedChecksTable.elements.serviceName('test_check')).toContainText(serviceName);
    });

    await test.step('3. Verify that check for the second node is executed on the second node.', async () => {
      const serviceName = 'mo-replica-integration-1';
      await advisorInsights.buttons.advisorInsights.click();
      await advisorInsights.verifyFailedAdvisorsForServiceAndType(serviceName, FailedAdvisorType.Notice, 1, Duration.ThreeMinutes);
      await advisorInsights.elements.failedAdvisorRow(serviceName).click();
      await advisorInsights.failedChecksTable.elements.showDetails('test_check').click();
      await expect(advisorInsights.failedChecksTable.elements.serviceName('test_check')).toContainText(serviceName);
    });

    await test.step('2. Verify that check for the third node is executed on the third node.', async () => {
      const serviceName = 'mo-replica-integration-2';
      await advisorInsights.buttons.advisorInsights.click();
      await advisorInsights.verifyFailedAdvisorsForServiceAndType(serviceName, FailedAdvisorType.Notice, 1, Duration.ThreeMinutes);
      await advisorInsights.elements.failedAdvisorRow(serviceName).click();
      await advisorInsights.failedChecksTable.elements.showDetails('test_check').click();
      await expect(advisorInsights.failedChecksTable.elements.serviceName('test_check')).toContainText(serviceName);
    });
  });

  test('PMM-T1684 Verify integrity of the new Advisors: Test example Check @developmentAdvisors', async ({ page }) => {
    let configurationAdvisors = new ConfigurationAdvisors(page);
    let advisorInsights = new AdvisorInsights(page);
    let mysqlDashboard = new MySqlDashboard(page);

    await test.step('1. Login and run advisors check', async () => {
      await page.waitForTimeout(Duration.ThirtySecond);
      await page.screenshot({ path: 'screenshot1.png' });
      await page.goto(mysqlDashboard.url);
      await page.waitForTimeout(Duration.ThirtySecond);
      await page.screenshot({ path: './playwright-report/data/screenshot.png' });
      await page.screenshot({ path: 'screenshot.png2' });
      await page.goto(advisorInsights.url);
      await advisorInsights.buttons.developmentAdvisors.click();
      await advisorInsights.openAllCategoryCollapseElements();
      await advisorInsights.buttons.runAdvisor('Check format V2').click();
      await advisorInsights.toast.checkToastMessage(advisorInsights.messages.advisorRunning('Check format V2'), { variant: 'success' });
    });

    await test.step('1. Login and run advisors check', async () => {
      await configurationAdvisors.buttons.advisorInsights.click();
      await advisorInsights.verifyFailedAdvisorsForServiceAndType('ps_integration_', FailedAdvisorType.Warning, 5, Duration.OneMinute);
    });
  });
});
