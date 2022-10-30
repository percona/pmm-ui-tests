const assert = require('assert');

const { adminPage } = inject();
const pmmFrameworkLoader = `bash ${adminPage.pathToFramework}`;
const pathToPMMFramework = adminPage.pathToPMMTests;

Feature('Integration tests for PSMDB & PMM');

Before(async ({ I, settingsAPI }) => {
  await I.Authorize();
});

const version = process.env.PSMDB_VERSION ? `${process.env.PSMDB_VERSION}` : '4.4';
const container_name = `psmdb_pmm_${version}`;
const remoteServiceName = 'remote_pmm-psmdb-integration';

const connection = {
  host: container_name,
  port: 27017,
};

Scenario(
  'Verify Adding MongoDB services remotely @pmm-psmdb-integration @not-ui-pipeline',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, inventoryAPI, grafanaAPI,
  }) => {
    const details = {
      serviceName: remoteServiceName,
      serviceType: 'MONGODB_SERVICE',
      port: '27017',
      host: container_name,
      cluster: 'mongodb_remote_cluster',
      environment: 'mongodb_remote_cluster',
    };

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage('mongodb');
    I.fillField(remoteInstancesPage.fields.hostName, details.host);
    I.fillField(remoteInstancesPage.fields.environment, details.environment);
    I.fillField(remoteInstancesPage.fields.cluster, details.cluster);
    I.click(remoteInstancesPage.fields.useQANMongoDBProfiler);
    I.click(this.fields.addService);
    I.waitForVisible(pmmInventoryPage.fields.agentsLink, 30);
    await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
      {
        serviceType: 'MONGODB_SERVICE',
        service: 'mongodb',
      },
      details.serviceName,
    );

    // Check Remote Instance also added and have running status
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(remoteServiceName);
    await pmmInventoryPage.verifyAgentHasStatusRunning(remoteServiceName);
  },
);

Scenario(
  'Verify metrics from PSMDB instances on PMM-Server @pmm-psmdb-integration @not-ui-pipeline',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, inventoryAPI, grafanaAPI,
  }) => {
    let response; let result;
    const metricName = 'mongodb_connections';

    await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep "mongodb_exporter" | grep "Running" | wc -l | grep "3"`);
    await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep "mongodb_profiler_agent" | grep "Running" | wc -l | grep "3"`);

    const clientServiceName = await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep MongoDB | head -1 | awk -F" " '{print $2}'`);

    // Waiting for metrics to start hitting for remotely added services
    I.wait(10);

    // verify metric for client container node instance
    response = await grafanaAPI.checkMetricExist(metricName, { type: 'service_name', value: clientServiceName });
    result = JSON.stringify(response.data.data.result);

    assert.ok(response.data.data.result.length !== 0, `Metrics ${metricName} from ${clientServiceName} should be available but got empty ${result}`);

    // verify metric for remote instance
    response = await grafanaAPI.checkMetricExist(metricName, { type: 'service_name', value: remoteServiceName });
    result = JSON.stringify(response.data.data.result);

    assert.ok(response.data.data.result.length !== 0, `Metrics ${metricName} from ${remoteServiceName} should be available but got empty ${result}`);
  },
).retry(1);

Scenario(
  'Verify dashboard after MongoDB Instances are added @pmm-psmdb-integration @not-ui-pipeline',
  async ({
    I, dashboardPage, adminPage, current,
  }) => {
    const clientServiceName = await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep MongoDB | head -1 | awk -F" " '{print $2}'`);

    const serviceList = [clientServiceName, remoteServiceName];

    for (const service of serviceList) {
      I.amOnPage(dashboardPage.mongoDbInstanceOverview.url);
      dashboardPage.waitForDashboardOpened();
      await adminPage.applyTimeRange('Last 5 minutes');
      await dashboardPage.applyFilter('Service Name', service);
      adminPage.performPageDown(5);
      await dashboardPage.expandEachDashboardRow();
      adminPage.performPageUp(5);
      await dashboardPage.verifyThereAreNoGraphsWithNA();
      await dashboardPage.verifyThereAreNoGraphsWithoutData(3);
    }

    for (const service of serviceList) {
      I.amOnPage(dashboardPage.mongodbReplicaSetSummaryDashboard.url);
      dashboardPage.waitForDashboardOpened();
      await adminPage.applyTimeRange('Last 5 minutes');
      adminPage.performPageDown(5);
      await dashboardPage.expandEachDashboardRow();
      adminPage.performPageUp(5);
      await dashboardPage.verifyThereAreNoGraphsWithNA();
      await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
    }
  },
).retry(1);

Scenario(
  'Verify QAN after MongoDB Instances is added @pmm-psmdb-integration @not-ui-pipeline',
  async ({
    I, qanOverview, qanFilters, qanPage, current, adminPage,
  }) => {
    const clientServiceName = await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep MongoDB | head -1 | awk -F" " '{print $2}'`);

    const serviceList = [clientServiceName, remoteServiceName];

    for (const service of serviceList) {
      I.amOnPage(qanPage.url);
      qanOverview.waitForOverviewLoaded();
      await adminPage.applyTimeRange('Last 12 hours');
      qanOverview.waitForOverviewLoaded();
      qanFilters.waitForFiltersToLoad();
      await qanFilters.applySpecificFilter(service);
      qanOverview.waitForOverviewLoaded();
      const count = await qanOverview.getCountOfItems();

      assert.ok(count > 0, `The queries for service ${service} instance do NOT exist, check QAN Data`);
    }
  },
).retry(1);
