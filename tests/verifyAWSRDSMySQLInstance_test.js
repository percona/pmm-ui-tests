const assert = require('assert');
const { SERVICE_TYPE } = require('./helper/constants');

Feature('Monitoring AWS RDS MySQL DB');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T138 Verify disabling enhanced metrics for RDS, PMM-T139 Verify disabling basic metrics for RDS, PMM-T9 Verify adding RDS instances [critical] @instances',
  async ({ I, remoteInstancesPage, pmmInventoryPage }) => {
    const instanceIdToMonitor = remoteInstancesPage.mysql57rds['Service Name'];

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded().openAddAWSRDSMySQLPage();
    remoteInstancesPage.discoverRDS();
    remoteInstancesPage.verifyInstanceIsDiscovered(instanceIdToMonitor);
    remoteInstancesPage.startMonitoringOfInstance(instanceIdToMonitor);
    remoteInstancesPage.verifyAddInstancePageOpened();
    await remoteInstancesPage.fillRemoteRDSFields(instanceIdToMonitor);
    remoteInstancesPage.createRemoteInstance(instanceIdToMonitor);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(instanceIdToMonitor);
    await pmmInventoryPage.verifyAgentHasStatusRunning(instanceIdToMonitor);
  },
);

// bug about failing error message https://jira.percona.com/browse/PMM-9301
xScenario(
  'Verify RDS allows discovery without credentials @instances',
  async ({ I, remoteInstancesPage }) => {
    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded().openAddAWSRDSMySQLPage();
    remoteInstancesPage.discoverRDSWithoutCredentials();
  },
).retry(1);

// Skipping the tests because QAN does not get any data right after instance was added for monitoring
xScenario(
  'Verify QAN Filters contain AWS RDS MySQL 5.6 after it was added for monitoring @instances',
  async ({
    I, queryAnalyticsPage, remoteInstancesPage,
  }) => {
    const filters = remoteInstancesPage.mysql57rds;

    I.amOnPage(I.buildUrlWithParams(queryAnalyticsPage.url, { from: 'now-5m' }));
    queryAnalyticsPage.waitForLoaded();
    for (const filter of Object.values(filters)) {
      I.waitForVisible(queryAnalyticsPage.filters.filterByName(filter), 30);
      I.seeElement(queryAnalyticsPage.filters.filterByName(filter));
    }
  },
);

Scenario(
  'Verify MySQL Instances Overview Dashboard for AWS RDS MySQL 5.7 data after it was added for monitoring @instances',
  async ({ I, dashboardPage }) => {
    I.amOnPage(I.buildUrlWithParams(dashboardPage.mySQLInstanceOverview.clearUrl, {
      cluster: 'rds57-cluster',
      from: 'now-5m',
    }));
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(7);
  },
);

Scenario(
  'Verify MySQL Instances Overview Dashboard contains AWS RDS MySQL 5.7 filters @instances',
  async ({ I, dashboardPage, remoteInstancesPage }) => {
    const filters = remoteInstancesPage.mysql57rds;

    I.amOnPage(dashboardPage.mySQLInstanceOverview.url);
    dashboardPage.waitForDashboardOpened();
    for (const key of Object.keys(filters)) {
      const locator = dashboardPage.expandFilters(key);

      await within(locator, () => {
        I.seeElement(locate('span').withText(filters[key]));
      });
    }
  },
);

Scenario(
  'PMM-T603 Verify MySQL RDS exporter is running in pull mode @instances',
  async ({
    grafanaAPI, remoteInstancesPage, inventoryAPI,
  }) => {
    const metricNames = ['aws_rds_cpu_credit_usage_average', 'rdsosmetrics_memory_total', 'rdsosmetrics_cpuUtilization_total'];
    const serviceName = remoteInstancesPage.mysql57rds['Service Name'];
    const { node_id } = await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.MYSQL, serviceName);
    const response = await inventoryAPI.apiGetAgentsViaNodeId(node_id);
    const result = response.data.rds_exporter[0];

    assert.ok(!result.push_metrics_enabled, `Push Metrics Enabled Flag Should not be present on response object for AWS RDS but found ${JSON.stringify(result)}`);
    for (const metric of metricNames) {
      await grafanaAPI.waitForMetric(metric, { type: 'node_id', value: node_id });
    }
  },
);
