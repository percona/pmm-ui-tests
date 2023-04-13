import { expect, test } from '@playwright/test';
import apiHelper from '@tests/api/helpers/apiHelper';
import { NodeDetails } from '@tests/tests/inventory/components/nodesTable';
import { ServiceDetails } from '@tests/tests/inventory/components/servicesTable';
import { pmmClientCommands, pmmServerCommands, systemCommands } from '@tests/helpers/CommandLine';
import Duration from '@tests/helpers/Duration';
import grafanaHelper from '@tests/helpers/GrafanaHelper';
import { MongoDBInstanceSummary } from '@tests/pages/dashboards/mongo/MongoDBInstanceSummary.page';
import HomeDashboard from '@tests/pages/HomeDashboard.page';
import { AddServicePage } from '@tests/tests/inventory/pages/AddService.page';
import { NodesPage } from '@tests/tests/inventory/pages/Nodes.page';
import { ServicesPage } from '@tests/tests/inventory/pages/Services.page';
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
    test.skip(pmmVersion < 37, 'Test is for versions 2.37.0+');
    const servicesPage = new ServicesPage(page);
    const homeDashboard = new HomeDashboard(page);
    const mongoDBInstanceSummary = new MongoDBInstanceSummary(page);
    const qan = new QAN(page);

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

    await test.step('5. Verify redirect for the QAN.', async () => {
      await page.goto(servicesPage.url);
      await servicesPage.servicesTable.buttons.options(localService.serviceName).click();
      await servicesPage.servicesTable.buttons.qan.click();
      await expect(qan.buttons.serviceNameCheckbox(localService.serviceName)).toBeChecked();
    });
  });

  test('PMM-T1671 Verify PMM Inventory redesign : Add service button @inventory @inventory-post-upgrade', async ({ page }) => {
    test.skip(pmmVersion < 37, 'Test is for versions 2.37.0+');
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
  });

  test('PMM-T1670 Verify PMM Inventory redesign : Layout & Nodes @inventory @inventory-post-upgrade', async ({ page }) => {
    test.skip(pmmVersion < 37, 'Test is for versions 2.37.0+');
    const servicesPage = new ServicesPage(page);
    const nodesPage = new NodesPage(page);
    let nodeDetails: NodeDetails = {};

    await test.step('1. Verify navigation to the Inventory Nodes page.', async () => {
      await page.goto(servicesPage.url);
      await servicesPage.buttons.nodesTab.click();
    });

    await test.step('2. Verify node details.', async () => {
      const nodeId = await pmmClientCommands.getNodeId();
      nodeDetails = await pmmServerCommands.getNodeDetails(nodeId);
      nodeDetails.nodeId = nodeId;
      await nodesPage.nodesTable.verifyNode(nodeDetails)
    });

    await test.step('3. Try to delete node.', async () => {
      await nodesPage.nodesTable.buttons.selectNode(nodeDetails.nodeName).check({ force: true });
      await expect(nodesPage.buttons.delete).toBeEnabled();
      await nodesPage.buttons.delete.click();
      await expect(nodesPage.nodesTable.elements.modalHeader).toHaveText(nodesPage.nodesTable.messages.confirmNodeDeleteHeader());
      await nodesPage.nodesTable.buttons.submit.click();
      await nodesPage.toast.checkToastMessage(nodesPage.nodesTable.messages.hasAgents(nodeDetails.nodeId).replace('\n', ''), { variant: 'error' });
    });

    await test.step('4. Force delete the node.', async () => {
      await nodesPage.buttons.delete.click();
      await nodesPage.nodesTable.buttons.force.check({ force: true });
      await nodesPage.nodesTable.buttons.submit.click();
      await nodesPage.toast.checkToastMessage(
        nodesPage.nodesTable.messages.nodesSuccessfullyDeleted(1),
        { variant: 'success', assertionTimeout: Duration.OneSecond }
      );
      await nodesPage.nodesTable.verifyTableDoesNotContain(nodeDetails.nodeId!);
      await nodesPage.nodesTable.verifyTableDoesNotContain(nodeDetails.nodeName!);
    });

    await test.step('5. Return env to clean state.', async () => {
      const containers = await systemCommands.getRunningContainerNames();
      const pmmAgentProcessId = await pmmClientCommands.getProcessId('pmm-agent');
      await pmmClientCommands.killProcess(pmmAgentProcessId.stdout);
      await pmmClientCommands.forceSetupAgent();
      await pmmClientCommands.startAgent();
      await page.waitForTimeout(5000);
      const mongoAddress = process.env.CI ? '127.0.0.1' : containers.find((container) => container.includes('mo-integration'));
      await pmmClientCommands.addMongoDb(mongoAddress || '');
    });
  });

  test('PMM-T1672 Verify PMM Inventory redesign : State of the agents @inventory @inventory-post-upgrade', async ({ page }) => {
    test.skip(pmmVersion < 37, 'Test is for versions 2.37.0+');
    test.info().annotations.push({
      type: 'Also Covers:',
      description: "PMM-T1673 - Verify PMM Inventory redesign, Negative scenario: Failing Agents",
    });
    const servicesPage = new ServicesPage(page);

    await test.step('1. Navigate to the Inventory page and expand Mongo service".', async () => {
      await page.goto(servicesPage.url);
      await servicesPage.servicesTable.elements.rowByText(localService.serviceName).waitFor({ state: 'visible' })
      await servicesPage.servicesTable.verifyAllMonitoring('OK');
      await servicesPage.servicesTable.buttons.showRowDetails(localService.serviceName).click();
      await expect(servicesPage.servicesTable.elements.agentStatus).toHaveText('4/4 running');
      await servicesPage.servicesTable.elements.monitoring(localService.serviceName).click();
      await expect(servicesPage.elements.runningStatusAgent).toHaveCount(4);
      await servicesPage.buttons.goBackToServices.click();
    });

    await test.step('2. Kill process mongodb_exporter and verify that Navigate to the Inventory page and expand Mongo service".', async () => {
      const mongoExporterProccessId = await pmmClientCommands.getProcessId('mongodb_exporter');
      await pmmClientCommands.moveFile(
        '/usr/local/percona/pmm2/exporters/mongodb_exporter',
        '/usr/local/percona/pmm2/exporters/mongodb_exporter_error');
      await pmmClientCommands.killProcess(mongoExporterProccessId.stdout);
      await page.reload();
      await servicesPage.servicesTable.buttons.showRowDetails(localService.serviceName).click();
      await expect(servicesPage.servicesTable.elements.agentStatus).toHaveText('3/4 running');
      await servicesPage.servicesTable.elements.monitoring(localService.serviceName).click();
      await expect(servicesPage.elements.waitingStatusAgent).toHaveCount(1);
      await servicesPage.buttons.goBackToServices.click();
    });

    await test.step('2. Kill process vmagent and verify that Inventory page shows vmagent as not running".', async () => {
      await pmmClientCommands.moveFile(
        '/usr/local/percona/pmm2/exporters/vmagent',
        '/usr/local/percona/pmm2/exporters/vmagent_error');
      const vmagentProcessId = await pmmClientCommands.getProcessId('vmagent');
      await pmmClientCommands.killProcess(vmagentProcessId.stdout);
      await page.reload();
      await servicesPage.servicesTable.buttons.showRowDetails(localService.serviceName).click();
      await expect(servicesPage.servicesTable.elements.agentStatus).toHaveText('2/4 running');
      await servicesPage.servicesTable.elements.monitoring(localService.serviceName).click();
      await expect(servicesPage.elements.waitingStatusAgent).toHaveCount(2);
      await servicesPage.buttons.goBackToServices.click();
    });

    await test.step('3. Kill process mongodb_exporter and verify that Inventory page shows mongodb exporter as not running".', async () => {
      await pmmClientCommands.moveFile(
        '/usr/sbin/pmm-agent',
        '/usr/sbin/pmm-agent_error');
      const pmmAgentProcessId = await pmmClientCommands.getProcessId('pmm-agent');
      await pmmClientCommands.killProcess(pmmAgentProcessId.stdout);
      await page.reload();;
      await servicesPage.servicesTable.buttons.showRowDetails(localService.serviceName).click();
      await expect(servicesPage.servicesTable.elements.agentStatus).toHaveText('4/4 not running');
      await servicesPage.servicesTable.elements.monitoring(localService.serviceName).click();
      await expect(servicesPage.elements.waitingStatusAgent).not.toBeVisible();
      await servicesPage.buttons.goBackToServices.click();
    });

    await test.step('3. Move all agents back to their original location.', async () => {
      await pmmClientCommands.moveFile('/usr/sbin/pmm-agent_error', '/usr/sbin/pmm-agent');
      await pmmClientCommands.moveFile(
        '/usr/local/percona/pmm2/exporters/vmagent_error',
        '/usr/local/percona/pmm2/exporters/vmagent');
      await pmmClientCommands.moveFile(
        '/usr/local/percona/pmm2/exporters/mongodb_exporter_error',
        '/usr/local/percona/pmm2/exporters/mongodb_exporter');
    });
  });
});
