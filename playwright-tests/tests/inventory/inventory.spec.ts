import { expect, test } from '@playwright/test';
import apiHelper from '@tests/api/apiHelper';
import { NodeDetails } from '@tests/components/configuration/nodesTable';
import { ServiceDetails } from '@tests/components/configuration/servicesTable';
import { pmmClientCommands, pmmServerCommands } from '@tests/helpers/CommandLine';
import grafanaHelper from '@tests/helpers/GrafanaHelper';
import { MongoDBInstanceSummary } from '@tests/pages/dashboards/mongo/MongoDBInstanceSummary.page';
import HomeDashboard from '@tests/pages/HomeDashboard.page';
import { AddServicePage } from '@tests/pages/inventory/AddService.page';
import { NodesPage } from '@tests/pages/inventory/Nodes.page';
import { ServicesPage } from '@tests/pages/inventory/Services.page';
import { QAN } from '@tests/pages/QAN/QueryAnalytics.page';

test.describe('Spec file for PMM inventory tests.', async () => {
  const localService: ServiceDetails = {
    serviceName: 'mo-integration-',
    nodeName: '',
    monitoring: 'OK',
    address: process.env.CI ? '127.0.0.1' : 'mo-integration-',
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

  test('PMM-T1670 Verify PMM Inventory redesign : Layout & Nodes @inventory @inventory-pre-upgrade @inventory-post-upgrade', async ({ page }) => {
    const servicesPage = new ServicesPage(page);
    const nodesPage = new NodesPage(page);
    let nodeDetails: NodeDetails = {};

    // Change to 37
    if (pmmVersion >= 36) {
      await test.step('1. Verify navigation to the Inventory Nodes page.', async () => {
        await page.goto(servicesPage.url);
        await servicesPage.buttons.nodesTab.click();
      });

      await test.step('2. Verify navigation to the Inventory Nodes page.', async () => {
        const nodeId = await pmmClientCommands.getNodeId();
        nodeDetails = await pmmServerCommands.getNodeDetails(nodeId);
        nodeDetails.nodeId = nodeId;
        console.log('node Details Are:');
        console.log(nodeDetails)
        await nodesPage.nodesTable.verifyNode(nodeDetails)
      });

      await test.step('3. Verify navigation to the Inventory Nodes page.', async () => {
        await nodesPage.nodesTable.buttons.selectNode(nodeDetails.nodeName).check({ force: true });
        await expect(nodesPage.buttons.delete).toBeEnabled();
        await nodesPage.buttons.delete.click();
        await expect(nodesPage.nodesTable.elements.modalHeader).toHaveText(nodesPage.nodesTable.messages.confirmNodeDeleteHeader());
        await nodesPage.nodesTable.buttons.submit.click();
        await nodesPage.toast.checkToastMessage(nodesPage.nodesTable.messages.hasAgents(nodeDetails.nodeId), { variant: 'error' });
      });

    } else {
      test.info().annotations.push({
        type: 'Old Version ',
        description: 'This test is for PMM version 2.37.0 and higher',
      });
    }
  });

  test('PMM-T1671 Verify PMM Inventory redesign : Add service button @inventory @inventory-pre-upgrade @inventory-post-upgrade', async ({ page }) => {
    // Change to 37
    if (pmmVersion >= 36) {
      const servicesPage = new ServicesPage(page);
      const addServicePage = new AddServicePage(page);

      await test.step('1. Go to services page and click "Add Service".', async () => {
        await page.goto(servicesPage.url);
        await servicesPage.buttons.addService.click();
      });

      await test.step('2. Verify that user in on Add Service page.', async () => {
        await addServicePage.verifyAllButtonsVisible();
        await expect(page).toHaveURL(addServicePage.url);
      });

    } else {
      test.info().annotations.push({
        type: 'Old Version ',
        description: 'This test is for PMM version 2.37.0 and higher',
      });
    }
  });

  test('PMM-T1672 Verify PMM Inventory redesign : State of the agents @inventory @inventory-pre-upgrade @inventory-post-upgrade', async ({ page }) => {
    // Change to 37
    if (pmmVersion >= 36) {
      const servicesPage = new ServicesPage(page);
      const addServicePage = new AddServicePage(page);

      await test.step('1. Go to services page and click "Add Service".', async () => {
        await page.goto(servicesPage.url);
        await servicesPage.servicesTable.elements.rowByText(localService.serviceName).waitFor({ state: 'visible' })
        await servicesPage.servicesTable.verifyAllMonitoring('OK');
        await servicesPage.servicesTable.buttons.showRowDetails(localService.serviceName).click();
        await expect(servicesPage.servicesTable.elements.agentStatus).toHaveText('4/4 running');
        await servicesPage.servicesTable.elements.monitoring(localService.serviceName).click();
        await expect(servicesPage.elements.runningStatusAgent).toHaveCount(4);
      });
    } else {
      test.info().annotations.push({
        type: 'Old Version ',
        description: 'This test is for PMM version 2.37.0 and higher',
      });
    }
  });
});