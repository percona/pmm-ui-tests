import { expect, test } from '@helpers//test-helper';
import apiHelper from '@api/helpers/api-helper';
import { NodeDetails } from '@tests/inventory/pages/components/nodes-table';
import { ServiceDetails } from '@tests/inventory/pages/components/services-table';
import cli from '@helpers/cli';
import Wait from '@helpers/enums/wait';
import grafanaHelper from '@helpers/grafana-helper';
import { api } from '@api/api';

test.describe('Spec file for PMM inventory tests.', async () => {
  const mongoLocalService: ServiceDetails = {
    serviceName: 'mo-integration-',
    nodeName: '',
    monitoring: 'OK',
    address: process.env.CI ? '127.0.0.1' : 'mo-integration-',
    port: '27017',
  };
  const psLocalService: ServiceDetails = {
    serviceName: 'ps_integration_',
    nodeName: '',
    monitoring: 'OK',
    address: process.env.CI ? '127.0.0.1' : 'ps_integration_',
    port: '3306',
  };
  const pdpgsqlLocalService: ServiceDetails = {
    serviceName: 'pdpgsql-integration-',
    nodeName: '',
    monitoring: 'OK',
    address: process.env.CI ? '127.0.0.1' : 'pdpgsql-integration-',
    port: '5432',
  };

  let pmmVersion: number;
  let agentLocation: string[];

  test.beforeAll(async () => {
    pmmVersion = (await api.pmm.serverV1.getPmmVersion()).minor;
  });

  test.beforeEach(async ({ page }) => {
    await apiHelper.confirmTour(page);
    await page.goto('');
    await grafanaHelper.authorize(page);
  });

  test('PMM-T1669 Verify PMM Inventory redesign : Layout & Services'
    + ' @inventory @inventory-pre-upgrade @inventory-post-upgrade', async ({ page, homeDashboardPage, servicesPage, mongoDBInstanceSummary, qanPage }) => {
    test.skip(pmmVersion < 37, 'Test is for versions 2.37.0+');

    await test.step('1. Verify navigation to the Inventory page.', async () => {
      await homeDashboardPage.pmmMenu.selectOption('PMM Inventory');
      await servicesPage.verifyPageLoaded();
      await servicesPage.sideMenu.elements.configuration.hover();
      await expect(homeDashboardPage.sideMenu.configuration.buttons.inventory)
        .toHaveText(homeDashboardPage.sideMenu.configuration.labels.inventory);
      await homeDashboardPage.sideMenu.configuration.buttons.inventory.click();
      await servicesPage.verifyPageLoaded();
      await page.goto(servicesPage.url);
      await servicesPage.verifyPageLoaded();
    });

    await test.step('2. Verify local MongoDB service.', async () => {
      await servicesPage.servicesTable.verifyService(mongoLocalService);
    });

    await test.step('3. Verify kebab menu for local MongoDB service.', async () => {
      await servicesPage.servicesTable.buttons.options(mongoLocalService.serviceName).click();
      await expect(servicesPage.servicesTable.buttons.deleteService).toBeVisible();
      await expect(servicesPage.servicesTable.buttons.serviceDashboard).toBeVisible();
      await expect(servicesPage.servicesTable.buttons.qan).toBeVisible();
    });

    await test.step('4. Verify redirect for the dashboard page.', async () => {
      await servicesPage.servicesTable.buttons.serviceDashboard.click();
      await expect(mongoDBInstanceSummary.elements.dashboardName)
        .toHaveText(mongoDBInstanceSummary.labels.dashboardName as string);
      await expect(mongoDBInstanceSummary.buttons.serviceName).toContainText(mongoLocalService.serviceName);
    });

    await test.step('5. Verify redirect for the QAN.', async () => {
      await page.goto(servicesPage.url);
      await servicesPage.servicesTable.buttons.options(mongoLocalService.serviceName).click();
      await servicesPage.servicesTable.buttons.qan.click();
      await expect(qanPage.buttons.serviceNameCheckbox(mongoLocalService.serviceName)).toBeChecked();
    });
  });

  test('PMM-T1226 Verify Agents has process_exec_path option on Inventory page'
    + ' @inventory @inventory-pre-upgrade @inventory-post-upgrade', async ({ page, servicesPage }) => {
    test.skip(pmmVersion < 37, 'Test is for versions 2.37.0+');

    await test.step('1. Navigate to the Inventory page.', async () => {
      await page.goto(servicesPage.url);
    });

    await test.step('2. Verify agents have process_exec_path.', async () => {
      await servicesPage.servicesTable.verifyAllServicesAgentsLabelsExcept(
        'process_exec_path',
        [
          'Qan mysql perfschema agent',
          'Qan mongodb profiler agent',
          'Qan postgresql pgstatmonitor agent',
          'Qan postgresql pgstatements agent',
          'Pmm agent',
        ],
      );
    });
  });

  test('PMM-T554 Check that all agents have status "RUNNING"'
    + ' @inventory @inventory-pre-upgrade @inventory-post-upgrade', async ({ page, servicesPage, nodesPage }) => {
    test.info().annotations.push({
      type: 'Also Covers',
      description: 'PMM-T342 Verify pmm-server node cannot be removed from PMM Inventory page',
    }, {
      type: 'Also Covers',
      description: 'PMM-T1346 Verify Inventory page has pagination for all tabs',
    });

    await test.step('1. Go to services page and and verify mysql database is present.', async () => {
      await page.goto(servicesPage.url);
      await servicesPage.servicesTable.elements.rowByText(psLocalService.serviceName).waitFor({ state: 'visible' });
    });

    await test.step('2. Verify pagination on the services table.', async () => {
      await servicesPage.servicesTable.verifyPagination(4);
    });

    await test.step('3. Navigate to the mysql agents page.', async () => {
      await servicesPage.servicesTable.buttons.showRowDetails(psLocalService.serviceName).click();
      await expect(servicesPage.servicesTable.elements.agentStatus).toHaveText('4/4 running');
      await servicesPage.servicesTable.elements.agentStatus.click();
    });

    await test.step('4. Verify pagination on the agents table.', async () => {
      await servicesPage.servicesTable.verifyPagination(4);
    });

    await test.step('3. Verify that all mysql agent have status running.', async () => {
      await servicesPage.agentsTable.verifyAllAgentsStatus('Running');
      await servicesPage.buttons.goBackToServices.click();
    });

    await test.step('4. Verify that all mongo agent have status running.', async () => {
      await servicesPage.servicesTable.buttons.showRowDetails(mongoLocalService.serviceName).click();
      await expect(servicesPage.servicesTable.elements.agentStatus).toHaveText('4/4 running');
      await servicesPage.servicesTable.elements.agentStatus.click();
      await servicesPage.agentsTable.verifyAllAgentsStatus('Running');
      await servicesPage.buttons.goBackToServices.click();
    });

    await test.step('4. Verify pagination on the nodes table.', async () => {
      await servicesPage.elements.nodesTab.click();
      await servicesPage.servicesTable.verifyPagination(2);
    });

    await test.step('5. Verify that pmm-server cannot be removed from the nodes table.', async () => {
      await nodesPage.nodesTable.buttons.selectNode('pmm-server').check({ force: true });
      await nodesPage.elements.deleteButton.click();
      await nodesPage.confirmDeleteModal.buttons.force.check({ force: true });
      await nodesPage.confirmDeleteModal.buttons.proceed.click();
      await nodesPage.toastMessage.waitForMessage(nodesPage.messages.pmmServerCannotBeRemoved);
      await nodesPage.page.reload();
      await nodesPage.nodesTable.elements.rowByText('pmm-server').waitFor({ state: 'visible' });
    });
  });

  test('PMM-T345 Verify removing pmm-agent on PMM Inventory page removes all associated agents'
    + ' @inventory @inventory-pre-upgrade @inventory-post-upgrade', async ({ page, servicesPage, nodesPage }) => {
    await test.step('1. Go to services page and and verify postgres database is present.', async () => {
      await page.goto(servicesPage.url);
      await servicesPage.servicesTable.elements.rowByText(pdpgsqlLocalService.serviceName).waitFor({ state: 'visible' });
    });

    await test.step('2. Navigate to the agent for the pdpgsql database.', async () => {
      await servicesPage.servicesTable.buttons.showRowDetails(pdpgsqlLocalService.serviceName).click();
      await expect(servicesPage.servicesTable.elements.agentStatus).toHaveText('4/4 running');
      await servicesPage.servicesTable.elements.agentStatus.click();
    });

    await test.step('3. Remove pmm agent.', async () => {
      await servicesPage.agentsTable.elements.checkbox('Pmm agent').check({ force: true });
      await servicesPage.agentsTable.buttons.delete.click();
      await nodesPage.confirmDeleteModal.buttons.force.check({ force: true });
      await servicesPage.confirmDeleteModal.buttons.proceed.click();
      await servicesPage.toastMessage.waitForMessage(servicesPage.agentsTable.messages.successfullyDeleted(1) as string);
      await expect(servicesPage.elements.noDataTable).toHaveText(servicesPage.agentsTable.messages.noAgents as string);
    });

    await test.step('4. Clean up env.', async () => {
      const pmmAgentProcessId = await cli.pmmClientCommands.getProcessId('pmm-agent');

      await cli.pmmClientCommands.killProcess(pmmAgentProcessId.stdout);
      const nodes = await api.pmm.inventoryV1.listNodes();

      if (process.env.CI) {
        await cli.pmmClientCommands.forceSetupAgent({
          name: nodes.generic![0].node_name, address: nodes.generic![0].address, type: 'generic',
        });
      } else {
        await cli.pmmClientCommands.forceSetupAgent({
          name: nodes.container![0].node_name, address: nodes.container![0].address, type: 'container',
        });
      }

      await cli.pmmClientCommands.startAgent();
      await page.waitForTimeout(5000);
      const containerNames = await cli.systemCommands.getRunningContainerNames();
      const mongoContainerName = containerNames.find((container: string | string[]) => container.includes('mo-integration')) || '';
      const psContainerName = containerNames.find((container: string | string[]) => container.includes('ps_integration_')) || '';
      const pdpgsqlContainerName = containerNames.find((container: string | string[]) => container.includes('pdpgsql-integration-')) || '';

      await cli.pmmClientCommands.addMongoDb({ address: process.env.CI ? '127.0.0.1' : mongoContainerName, name: mongoContainerName });
      await cli.pmmClientCommands.addMySql({
        address: process.env.CI ? '127.0.0.1' : psContainerName, name: psContainerName, port: process.env.CI ? 43306 : 3306,
      });
      await cli.pmmClientCommands.addPgSql({
        address: process.env.CI ? '127.0.0.1' : pdpgsqlContainerName, name: pdpgsqlContainerName, port: process.env.CI ? 6432 : 5432,
      });
    });
  });

  test('PMM-T343 Verify agent can be removed on PMM Inventory page'
    + ' @inventory @inventory-pre-upgrade @inventory-post-upgrade', async ({ page, servicesPage }) => {
    test.skip(pmmVersion < 37, 'Test is for versions 2.37.0+');

    await test.step('1. Go to services page and and verify mysql database is present.', async () => {
      await page.goto(servicesPage.url);
      await servicesPage.servicesTable.elements.rowByText(psLocalService.serviceName).waitFor({ state: 'visible' });
    });

    await test.step('2. Select MySql options and verify all agents are running.', async () => {
      await servicesPage.servicesTable.buttons.showRowDetails(psLocalService.serviceName).click();
      await expect(servicesPage.servicesTable.elements.agentStatus).toHaveText('4/4 running');
    });

    await test.step('3. Navigate to the agents, and delete mysql exporter.', async () => {
      await servicesPage.servicesTable.elements.agentStatus.click();
      await servicesPage.agentsTable.elements.checkbox('Mysqld exporter').check({ force: true });
      await servicesPage.agentsTable.buttons.delete.click();
      await servicesPage.confirmDeleteModal.buttons.proceed.click();
      await servicesPage.toastMessage.waitForMessage(servicesPage.agentsTable.messages.successfullyDeleted(1) as string);
      await servicesPage.buttons.goBackToServices.click();
      await servicesPage.servicesTable.buttons.showRowDetails(psLocalService.serviceName).click();
      await expect(servicesPage.servicesTable.elements.agentStatus).toHaveText('3/3 running');
    });
  });

  test('PMM-T1671 Verify PMM Inventory redesign : Add service button'
      + ' @inventory @inventory-post-upgrade', async ({ page, servicesPage, addServicePage }) => {
    test.skip(pmmVersion < 37, 'Test is for versions 2.37.0+');

    await test.step('1. Go to services page and click "Add Service".', async () => {
      await page.goto(servicesPage.url);
      await servicesPage.buttons.addService.click();
    });

    await test.step('2. Verify that user in on Add Service page.', async () => {
      await addServicePage.verifyAllButtonsVisible();
      await expect(page).toHaveURL(addServicePage.url);
    });
  });

  test('PMM-T1670 Verify PMM Inventory redesign : Layout & Nodes @inventory'
      + ' @inventory-post-upgrade', async ({ page, servicesPage, nodesPage }) => {
    test.skip(pmmVersion < 37, 'Test is for versions 2.37.0+');
    test.info().annotations.push({
      type: 'Also Covers',
      description: 'PMM-T340 Verify node with agents, services can be removed on PMM Inventory page',
    });
    let nodeDetails: NodeDetails = {};

    await test.step('1. Verify navigation to the Inventory Nodes page.', async () => {
      await page.goto(servicesPage.url);
      await servicesPage.elements.nodesTab.click();
    });

    await test.step('2. Verify node details.', async () => {
      const nodeId = await cli.pmmClientCommands.getNodeId();

      nodeDetails = await cli.pmmServerCommands.getNodeDetails(nodeId);
      nodeDetails.nodeId = nodeId;
      nodeDetails.services = ['3 services'];
      await nodesPage.nodesTable.verifyNode(nodeDetails, pmmVersion);
    });

    await test.step('3. Try to delete node.', async () => {
      await nodesPage.nodesTable.buttons.selectNode(nodeDetails.nodeName).check({ force: true });
      await expect(nodesPage.elements.deleteButton).toBeEnabled();
      await nodesPage.elements.deleteButton.click();
      await expect(nodesPage.confirmDeleteModal.elements.modalHeader)
        .toHaveText(nodesPage.confirmDeleteModal.messages.confirmNodeDeleteHeader() as string);
      await nodesPage.confirmDeleteModal.buttons.proceed.click();
      await nodesPage.toastMessage
        .waitForMessage(nodesPage.nodesTable.messages.hasAgents(nodeDetails.nodeId).replace('\n', '') as string);
    });

    await test.step('4. Force delete the node.', async () => {
      await nodesPage.elements.deleteButton.click();
      await nodesPage.confirmDeleteModal.buttons.force.check({ force: true });
      await nodesPage.confirmDeleteModal.buttons.proceed.click();
      await nodesPage.toastMessage.waitForMessage(nodesPage.nodesTable.messages.nodesSuccessfullyDeleted(1) as string, Wait.OneSecond);
      await nodesPage.nodesTable.verifyTableDoesNotContain(nodeDetails.nodeId as string);
      await nodesPage.nodesTable.verifyTableDoesNotContain(nodeDetails.nodeName as string);
    });

    await test.step('5. Return env to clean state.', async () => {
      const containers = await cli.systemCommands.getRunningContainerNames();
      const pmmAgentProcessId = await cli.pmmClientCommands.getProcessId('pmm-agent');

      await cli.pmmClientCommands.killProcess(pmmAgentProcessId.stdout);
      await cli.pmmClientCommands.forceSetupAgent();
      await cli.pmmClientCommands.startAgent();
      await page.waitForTimeout(5000);
      const mongoContainerName = containers.find((container: string | string[]) => container.includes('mo-integration')) || '';
      const psContainerName = containers.find((container: string | string[]) => container.includes('ps_integration_')) || '';
      const pdpgsqlContainerName = containers.find((container: string | string[]) => container.includes('pdpgsql-integration-')) || '';

      await cli.pmmClientCommands.addMongoDb({ address: process.env.CI ? '127.0.0.1' : mongoContainerName, name: mongoContainerName });
      await cli.pmmClientCommands.addMySql({
        address: process.env.CI ? '127.0.0.1' : psContainerName, name: psContainerName, port: process.env.CI ? 43306 : 3306,
      });
      await cli.pmmClientCommands.addPgSql({
        address: process.env.CI ? '127.0.0.1' : pdpgsqlContainerName, name: pdpgsqlContainerName, port: process.env.CI ? 6432 : 5432,
      });
    });
  });

  test('PMM-T1672 Verify PMM Inventory redesign : State of the agents'
      + ' @inventory @inventory-post-upgrade', async ({ page, servicesPage }) => {
    test.skip(pmmVersion < 37, 'Test is for versions 2.37.0+');
    test.info().annotations.push({
      type: 'Also Covers:',
      description: 'PMM-T1673 - Verify PMM Inventory redesign, Negative scenario: Failing Agents',
    });

    await test.step('1. Navigate to the Inventory page and expand Mongo service".', async () => {
      await page.goto(servicesPage.url);
      await servicesPage.servicesTable.elements.rowByText(mongoLocalService.serviceName).waitFor({ state: 'visible' });
      await servicesPage.servicesTable.verifyAllMonitoring('OK');
      await servicesPage.servicesTable.buttons.showRowDetails(mongoLocalService.serviceName).click();
      await expect(servicesPage.servicesTable.elements.agentStatus).toHaveText('4/4 running');
      await servicesPage.servicesTable.elements.monitoring(mongoLocalService.serviceName).click();
      await expect(servicesPage.elements.runningStatusAgent).toHaveCount(4);
      await servicesPage.buttons.goBackToServices.click();
    });

    await test.step('2. Kill process mongodb_exporter and verify that Navigate to the Inventory page and expand Mongo service".', async () => {
      const mongoExporterProccessId = await cli.pmmClientCommands.getProcessId('mongodb_exporter');

      await cli.pmmClientCommands.moveFile(
        '/usr/local/percona/pmm2/exporters/mongodb_exporter',
        '/usr/local/percona/pmm2/exporters/mongodb_exporter_error',
      );
      await cli.pmmClientCommands.killProcess(mongoExporterProccessId.stdout);
      await page.reload();
      await servicesPage.servicesTable.buttons.showRowDetails(mongoLocalService.serviceName).click();
      await expect(servicesPage.servicesTable.elements.agentStatus).toHaveText('3/4 running');
      await servicesPage.servicesTable.elements.monitoring(mongoLocalService.serviceName).click();
      await expect(servicesPage.elements.waitingStatusAgent).toHaveCount(1);
      await servicesPage.buttons.goBackToServices.click();
    });

    await test.step('2. Kill process vmagent and verify that Inventory page shows vmagent as not running".', async () => {
      await cli.pmmClientCommands.moveFile(
        '/usr/local/percona/pmm2/exporters/vmagent',
        '/usr/local/percona/pmm2/exporters/vmagent_error',
      );
      const vmagentProcessId = await cli.pmmClientCommands.getProcessId('vmagent');

      await cli.pmmClientCommands.killProcess(vmagentProcessId.stdout);
      await page.reload();
      await servicesPage.servicesTable.buttons.showRowDetails(mongoLocalService.serviceName).click();
      await expect(servicesPage.servicesTable.elements.agentStatus).toHaveText('2/4 running');
      await servicesPage.servicesTable.elements.monitoring(mongoLocalService.serviceName).click();
      await expect(servicesPage.elements.waitingStatusAgent).toHaveCount(2);
      await servicesPage.buttons.goBackToServices.click();
    });

    await test.step('3. Kill process mongodb_exporter and verify that Inventory page shows mongodb exporter as not running".', async () => {
      agentLocation = await cli.pmmClientCommands.findFile('pmm-agent');
      agentLocation = agentLocation.filter((location) => location.startsWith('/usr/'));
      console.log('Agent Location is: ');
      console.log(agentLocation);
      await cli.pmmClientCommands.moveFile(
        agentLocation[0],
        `${agentLocation[0]}_error`,
      );
      const pmmAgentProcessId = await cli.pmmClientCommands.getProcessId('pmm-agent');

      await cli.pmmClientCommands.killProcess(pmmAgentProcessId.stdout);
      await page.reload();
      await servicesPage.servicesTable.buttons.showRowDetails(mongoLocalService.serviceName).click();
      await expect(servicesPage.servicesTable.elements.agentStatus).toHaveText('4/4 not running');
      await servicesPage.servicesTable.elements.monitoring(mongoLocalService.serviceName).click();
      await expect(servicesPage.elements.waitingStatusAgent).toBeHidden();
      await servicesPage.buttons.goBackToServices.click();
    });

    await test.step('3. Move all agents back to their original location.', async () => {
      await cli.pmmClientCommands.moveFile(`${agentLocation[0]}_error`, agentLocation[0]);
      await cli.pmmClientCommands.moveFile(
        '/usr/local/percona/pmm2/exporters/vmagent_error',
        '/usr/local/percona/pmm2/exporters/vmagent',
      );
      await cli.pmmClientCommands.moveFile(
        '/usr/local/percona/pmm2/exporters/mongodb_exporter_error',
        '/usr/local/percona/pmm2/exporters/mongodb_exporter',
      );
    });
  });

  test('PMM-T339 Verify MySQL service is removed on PMM Inventory page'
      + ' @inventory @inventory-post-upgrade', async ({ page, servicesPage }) => {
    test.skip(pmmVersion < 37, 'Test is for versions 2.37.0+');
    let serviceId: string;

    await test.step('1. Navigate to the Inventory page".', async () => {
      await page.goto(servicesPage.url);
    });

    await test.step('2. Get Service id for the MySql service.', async () => {
      const services = await api.pmm.managementV1.listServices();

      serviceId = services.services.find((service: { service_name: string }) => service.service_name.includes(psLocalService.serviceName)).service_id;
    });

    await test.step('3. Select MySql service and try to delete.', async () => {
      await servicesPage.servicesTable.buttons.selectService(psLocalService.serviceName).check({ force: true });
      await servicesPage.elements.deleteButton.click();
      await servicesPage.confirmDeleteModal.buttons.proceed.click();
      await servicesPage.toastMessage.waitForMessage(servicesPage.confirmDeleteModal.messages.serviceHasAgents(serviceId) as string);
    });

    await test.step('4. Force Delete MySql service.', async () => {
      await servicesPage.elements.deleteButton.click();
      await servicesPage.confirmDeleteModal.buttons.force.check({ force: true });
      await servicesPage.confirmDeleteModal.buttons.proceed.click();
      await servicesPage.toastMessage.waitForMessage(servicesPage.servicesTable.messages.successfullyDeleted(1) as string);
      await servicesPage.servicesTable.elements.rowByText(psLocalService.serviceName).waitFor({ state: 'detached' });
    });
  });
});
