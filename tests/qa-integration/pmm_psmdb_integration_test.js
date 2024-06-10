const assert = require('assert');

Feature('Integration tests for PSMDB & PMM');

Before(async ({ I }) => {
  await I.Authorize();
});

const version = process.env.PSMDB_VERSION ? `${process.env.PSMDB_VERSION}` : '4.4';
const replica_container_name = `psmdb_pmm_${version}_replica`;
const regular_container_name = `psmdb_pmm_${version}_regular`;
const arbiter_container_name = `psmdb_pmm_${version}_arbiter`;
const remoteServiceName = 'remote_pmm-psmdb-integration';

const connection = {
  host: regular_container_name,
  port: 27017,
  username: 'pmm_mongodb',
  password: 'GRgrO9301RuF',
};

Scenario(
  'Verify Adding MongoDB services remotely @pmm-psmdb-regular-integration @not-ui-pipeline',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, inventoryAPI,
  }) => {
    const details = {
      serviceName: remoteServiceName,
      serviceType: 'MONGODB_SERVICE',
      port: '27017',
      username: connection.username,
      password: connection.password,
      host: regular_container_name,
      cluster: 'mongodb_remote_cluster',
      environment: 'mongodb_remote_cluster',
    };

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage('mongodb');
    I.fillField(remoteInstancesPage.fields.hostName, details.host);
    I.clearField(remoteInstancesPage.fields.portNumber);
    I.fillField(remoteInstancesPage.fields.portNumber, details.port);
    I.fillField(remoteInstancesPage.fields.userName, details.username);
    I.fillField(remoteInstancesPage.fields.serviceName, remoteServiceName);
    I.fillField(remoteInstancesPage.fields.password, details.password);
    I.fillField(remoteInstancesPage.fields.environment, details.environment);
    I.fillField(remoteInstancesPage.fields.cluster, details.cluster);
    I.click(remoteInstancesPage.fields.useQANMongoDBProfiler);
    I.click(remoteInstancesPage.fields.addService);
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

Scenario.skip(
  'Verify metrics from PSMDB instances on PMM-Server @pmm-psmdb-replica-integration @not-ui-pipeline',
  async ({
    I, grafanaAPI,
  }) => {
    let response; let result;
    const metricName = 'mongodb_connections';

    await I.verifyCommand(`docker exec ${replica_container_name} pmm-admin list | grep "mongodb_exporter" | grep "Running" | wc -l | grep "3"`);
    await I.verifyCommand(`docker exec ${replica_container_name} pmm-admin list | grep "mongodb_profiler_agent" | grep "Running" | wc -l | grep "3"`);

    const clientServiceName = (await I.verifyCommand(`docker exec ${replica_container_name} pmm-admin list | grep MongoDB | head -1 | awk -F" " '{print $2}'`)).trim();

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

Scenario.skip(
  'Verify dashboard after MongoDB Instances are added @pmm-psmdb-replica-integration @not-ui-pipeline',
  async ({
    I, dashboardPage, adminPage,
  }) => {
    const clientServiceName = (await I.verifyCommand(`docker exec ${replica_container_name} pmm-admin list | grep MongoDB | head -1 | awk -F" " '{print $2}'`)).trim();

    const serviceList = [clientServiceName, remoteServiceName];

    for (const service of serviceList) {
      const url = I.buildUrlWithParams(dashboardPage.mongoDbInstanceOverview.url, { from: 'now-5m', to: 'now', service_name: service });

      I.amOnPage(url);
      dashboardPage.waitForDashboardOpened();
      adminPage.performPageDown(5);
      await dashboardPage.expandEachDashboardRow();
      adminPage.performPageUp(5);
      if (service === remoteServiceName) {
        await dashboardPage.verifyThereAreNoGraphsWithNA(1);
        await dashboardPage.verifyThereAreNoGraphsWithoutData(9);
      } else {
        await dashboardPage.verifyThereAreNoGraphsWithNA();
        await dashboardPage.verifyThereAreNoGraphsWithoutData(3);
      }
    }

    I.amOnPage(`${dashboardPage.mongodbReplicaSetSummaryDashboard.url}&var-replset=rs1`);
    dashboardPage.waitForDashboardOpened();
    adminPage.performPageDown(5);
    await dashboardPage.expandEachDashboardRow();
    adminPage.performPageUp(5);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
  },
).retry(1);

Scenario.skip(
  'Verify QAN after MongoDB Instances is added @pmm-psmdb-replica-integration @not-ui-pipeline',
  async ({
    I, qanOverview, qanFilters, qanPage,
  }) => {
    const clientServiceName = (await I.verifyCommand(`docker exec ${replica_container_name} pmm-admin list | grep MongoDB | head -1 | awk -F" " '{print $2}'`)).trim();

    const serviceList = [clientServiceName, remoteServiceName];

    for (const service of serviceList) {
      const url = I.buildUrlWithParams(qanPage.clearUrl, { from: 'now-120m', to: 'now' });

      I.amOnPage(url);
      qanOverview.waitForOverviewLoaded();
      qanFilters.waitForFiltersToLoad();
      await qanFilters.applySpecificFilter(service);
      qanOverview.waitForOverviewLoaded();
      const count = await qanOverview.getCountOfItems();

      assert.ok(count > 0, `The queries for service ${service} instance do NOT exist, check QAN Data`);
    }
  },
).retry(1);

Scenario.skip(
  'T2269 Verify Replicaset dashboard for MongoDB Instances contains ARBITER node @pmm-psmdb-arbiter-integration @not-ui-pipeline',
  async ({
    I, dashboardPage,
  }) => {
    const arbiterLocator = '(//div[@ng-show=\'ctrl.panel.showLegendValues\'][contains(.,\'ARBITER\')])[1]';

    I.amOnPage(`${dashboardPage.mongodbReplicaSetSummaryDashboard.url}&var-replset=rs1`);
    dashboardPage.waitForDashboardOpened();
    await I.waitForElement({ xpath: arbiterLocator }, 60);
    const numberOfVisibleElements = await I.grabNumberOfVisibleElements(arbiterLocator);

    I.assertEqual(numberOfVisibleElements, 1, 'No of ARBITER elements for ReplicatSet are not as expected');
  },
).retry(2);

Scenario.skip(
  'T2317 Verify Wrong Replication Lag by Set values if RS is PSA -( MongoDB Cluster Summary) @pmm-psmdb-arbiter-integration @not-ui-pipeline',
  async ({
    I, dashboardPage,
  }) => {
    I.amOnPage(`${dashboardPage.mongodbReplicaSetSummaryDashboard.url}&var-replset=rs1`);
    dashboardPage.waitForDashboardOpened();

    // Grab secs or year lag value from Replication Lag min field in UI
    const replLagLocator = '(//a[@data-testid=\'data-testid dashboard-row-title-Replication Lag\']/following::a[contains(text(),\'mongodb_rs2_1\')]/following::td[contains(text(),\' s\') or contains(text(),\' year\')])[1]';

    await I.waitForElement(replLagLocator, 500);
    // Get the text content of the element located
    const replLagText = await I.grabTextFrom(replLagLocator);
    // Grab only Lag value required from Text
    const actualLagValue = +replLagText.split('.', 1);
    // Grab actual Lag value required from database
    let expectedLagValue = (await I.verifyCommand(`docker exec -w /mongosh/bin/ ${arbiter_container_name} ./mongosh --eval rs\.printSecondaryReplicationInfo\\(\\) | awk '/replLag:/ {print $2}' | cut -c 2`)).trim();

    // Give some threshold increase for actual replication lag, for now 2 secs extra
    expectedLagValue = +expectedLagValue + 2;
    I.assertBelow(actualLagValue, expectedLagValue, 'ReplicaLag is more than expected lag vaule');
  },
);

Scenario('PMM-T1889 Verify Mongo replication lag graph shows correct info @pmm-psmdb-replica-integration', async ({ I, dashboardPage }) => {
  const lagValue = 10;
  const testConfigFile = `c = rs.conf(); c.members[2].secondaryDelaySecs = ${lagValue}; c.members[2].priority = 0; c.members[2].hidden = true; rs.reconfig(c);`;
  const serviceName = 'rs103';
  const graphName = 'Replication Lag';

  await I.verifyCommand(`sudo docker exec rs101 mongo "mongodb://root:root@localhost/?replicaSet=rs" --eval "${testConfigFile}"`);
  I.amOnPage(I.buildUrlWithParams(dashboardPage.mongodbReplicaSetSummaryDashboard.cleanUrl, { from: 'now-5m', refresh: '5s' }));
  dashboardPage.waitForDashboardOpened();

  await I.waitForElement(dashboardPage.graphLegendColumnValueByExpression(graphName, serviceName, 'max', '>= 10'), 120);

  const maxValue = await I.grabTextFrom(dashboardPage.graphLegendSeriesRowByTitle(graphName, serviceName));

  I.assertFalse(/min|hour|day|week|month|year/.test(maxValue), `Max replication value should be in seconds. Value is: ${maxValue}`);
});
