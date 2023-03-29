import { expect, test } from '@playwright/test';
import apiHelper from '@tests/api/apiHelper';
import { ServiceDetails } from '@tests/components/configuration/servicesTable';
import { pmmServerCommand } from '@tests/helpers/CommandLine';
import grafanaHelper from '@tests/helpers/GrafanaHelper';
import { MongoDBInstanceSummary } from '@tests/pages/dashboards/mongo/MongoDBInstanceSummary.page';
import HomeDashboard from '@tests/pages/HomeDashboard.page';
import { AddServicePage } from '@tests/pages/inventory/AddService.page';
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
    const homeDashboard = new HomeDashboard(page);
    const mongoDBInstanceSummary = new MongoDBInstanceSummary(page);
    const qan = new QAN(page);
    const nodeDetails: { nodeName?, nodeId?} = {};

    // Change to 37
    if (pmmVersion >= 36) {
      await test.step('1. Verify navigation to the Inventory Nodes page.', async () => {
        await page.goto(servicesPage.url);
        await servicesPage.buttons.nodesTab.click();
        // const mongoExporter = (await executeCommand('sudo docker exec pmm-integration-client pmm-admin status | grep "Node name"')).stdout;
        const status = `Agent ID : /agent_id/7a35736c-4c00-4779-8733-f3259955ea6f
        Node ID  : /node_id/4896b722-c00c-44b6-bc63-55bd5e8a5aa4
        Node name: adf96aa1f51e
        
        PMM Server:
                URL    : https://pmm-integration-server:443/
                Version: 2.36.0-HEAD-cee641db
        
        PMM Client:
                Connected        : true
                Time drift       : 135.55µs
                Latency          : 468.95µs
                Connection uptime: 100
                pmm-admin version: 2.37.0
                pmm-agent version: 2.37.0
        Agents:
                /agent_id/16924389-4946-4860-8df2-a5be62100f4a vmagent Running 42000
                /agent_id/24272020-eaa1-4563-86ea-de3e0e2829d4 mongodb_exporter Running 42002
                /agent_id/692d3907-34f1-4c6d-9774-614a7d9c30fd node_exporter Running 42001
                /agent_id/6b06f457-0878-4323-b217-d9ce35bc7062 mongodb_profiler_agent Running 0`.replaceAll(' ', '');
        const statusLines = status.split(/\r?\n/);
        // console.log(statusLines)
        nodeDetails.nodeName = statusLines.find((line) => line.includes('Nodename:'))?.replace('Nodename:', '');
        nodeDetails.nodeId = statusLines.find((line) => line.includes('NodeID:'))?.replace('NodeID:', '');
        const nodeId = `                    node_id
        -----------------------------------------------
         pmm-server
         /node_id/4896b722-c00c-44b6-bc63-55bd5e8a5aa4
        (2 rows)`
        const nodeType = ` node_type 
        -----------
         generic
         container
        (2 rows)`
        // NODE_TYPE_INVALID GENERIC_NODE CONTAINER_NODE REMOTE_NODE REMOTE_RDS_NODE REMOTE_AZURE_DATABASE_NODE
        // console.log(nodeType.split(/\r?\n/).filter((type) => (!type.includes('node_type') || !type.includes('------') || !type.includes('row'))))
        console.log(nodeType.split(/\r?\n/).filter((type) => (!type.includes('node_type') && !type.includes('-----') && !type.includes('rows'))))
        console.log(nodeId.split(/\r?\n/).find((row) => row.includes('/node_id/')));
        console.log('PMM Server node IDs are: ');
        console.log(await pmmServerCommand.getNodeIds());
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
});