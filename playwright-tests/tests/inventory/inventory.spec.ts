import { expect, test } from '@playwright/test';
import apiHelper from '@tests/api/apiHelper';
import { ServiceDetails } from '@tests/components/configuration/servicesTable';
import grafanaHelper from '@tests/helpers/GrafanaHelper';
import { MongoDBInstanceSummary } from '@tests/pages/dashboards/mongo/MongoDBInstanceSummary.page';
import HomeDashboard from '@tests/pages/HomeDashboard.page';
import { ServicesPage } from '@tests/pages/inventory/Services.page';
import { QAN } from '@tests/pages/QAN/QueryAnalytics.page';

test.describe('Spec file for PMM inventory tests.', async () => {
  const localService: ServiceDetails = {
    serviceName: 'mo-integration-',
    nodeName: '',
    monitoring: 'OK',
    address: 'mo-integration-',
    port: '27017'
  };
  let pmmVersion: number;

  test.beforeAll(async () => {
    if (!pmmVersion) {
      const versionString = (await apiHelper.getPmmVersion()).versionMinor;
      pmmVersion = parseInt(versionString);
    }
  })

  test.beforeEach(async ({ page }) => {
    await apiHelper.confirmTour(page);
    await page.goto('');
    await grafanaHelper.authorize(page, 'admin', 'admin');
  });

  test('PMM-T1669 Verify PMM Inventory redesign : Layout & Services @inventory @inventory-pre-upgrade @inventory-post-upgrade', async ({ page }) => {
    const servicesPage = new ServicesPage(page);
    const homeDashboard = new HomeDashboard(page);
    const mongoDBInstanceSummary = new MongoDBInstanceSummary(page);
    const qan = new QAN(page);

    // Change to 37
    if (pmmVersion >= 36) {
      await test.step('1. Verify navigation to the Inventory page.', async () => {
        await homeDashboard.pmmMenu.selectOption('PMM Inventory');
        await servicesPage.verifyPageLoaded()
        await servicesPage.sideMenu.elements.configuration.hover();
        await expect(homeDashboard.sideMenu.configuration.buttons.inventory).toHaveText(
          homeDashboard.sideMenu.configuration.labels.inventory,
        );
        await homeDashboard.sideMenu.configuration.buttons.inventory.click();
        await servicesPage.verifyPageLoaded()
        await page.goto(servicesPage.url);
        await servicesPage.verifyPageLoaded()
      });

      await test.step('2. Verify local MongoDB service.', async () => {
        await servicesPage.servicesTable.verifyService(localService);

      });

      await test.step('3. Verify kebab menu for local MongoDB service.', async () => {
        await servicesPage.servicesTable.buttons.options(localService.serviceName).click();
        await expect(servicesPage.servicesTable.buttons.deleteService).toBeVisible();
        await expect(servicesPage.servicesTable.buttons.serviceDashboard).toBeVisible();
        await expect(servicesPage.servicesTable.buttons.qan).toBeVisible();
      });

      await test.step('4. Verify redirect for the dashboard page.', async () => {
        await servicesPage.servicesTable.buttons.serviceDashboard.click();
        await expect(mongoDBInstanceSummary.elements.dashboardName).toHaveText(mongoDBInstanceSummary.labels.dashboardName);
        await expect(mongoDBInstanceSummary.buttons.serviceName).toContainText(localService.serviceName);
      });

      await test.step('4. Verify redirect for the QAN.', async () => {
        await page.goto(servicesPage.url);
        await servicesPage.servicesTable.buttons.options(localService.serviceName).click();
        await servicesPage.servicesTable.buttons.qan.click();
        await expect(qan.buttons.serviceNameCheckbox(localService.serviceName)).toBeChecked();
      });

    } else {
      test.info().annotations.push({
        type: 'Old Version ',
        description: 'This test is for PMM version 2.37.0 and higher',
      });
    }
  });
});