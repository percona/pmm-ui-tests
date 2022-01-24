const assert = require('assert');

Feature('Monitoring AWS RDS MySQL DB');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T138 Verify disabling enhanced metrics for RDS, PMM-T139 Verify disabling basic metrics for RDS, PMM-T9 Verify adding RDS instances [critical] @instances',
  async ({ I, remoteInstancesPage, pmmInventoryPage }) => {
    const instanceIdToMonitor = remoteInstancesPage.rds['Service Name'];

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded().openAddAWSRDSMySQLPage();
    remoteInstancesPage.discoverRDS();
    remoteInstancesPage.verifyInstanceIsDiscovered(instanceIdToMonitor);
    remoteInstancesPage.startMonitoringOfInstance(instanceIdToMonitor);
    remoteInstancesPage.verifyAddInstancePageOpened();
    remoteInstancesPage.fillRemoteRDSFields(instanceIdToMonitor);
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

Scenario(
  'Verify AWS RDS MySQL 5.6 instance has status running [critical] @instances',
  async ({ I, remoteInstancesPage, pmmInventoryPage }) => {
    const serviceName = remoteInstancesPage.rds['Service Name'];

    I.amOnPage(pmmInventoryPage.url);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(serviceName);
    await pmmInventoryPage.verifyAgentHasStatusRunning(serviceName);
  },
);
// Skipping the tests because QAN does not get any data right after instance was added for monitoring
xScenario(
  'Verify QAN Filters contain AWS RDS MySQL 5.6 after it was added for monitoring @instances',
  async ({
    I, qanPage, remoteInstancesPage, qanFilters,
  }) => {
    const filters = remoteInstancesPage.rds;

    I.amOnPage(qanPage.url);
    qanFilters.waitForFiltersLoad();
    await qanFilters.expandAllFilter();
    for (const filter of Object.values(filters)) {
      const name = qanFilters.getFilterLocator(filter);

      I.waitForVisible(name, 30);
      I.seeElement(name);
    }
  },
);

Scenario(
  'Verify MySQL Instances Overview Dashboard for AWS RDS MySQL 5.6 data after it was added for monitoring @instances',
  async ({ I, dashboardPage }) => {
    I.amOnPage(dashboardPage.mySQLInstanceOverview.urlWithRDSFilter);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyThereAreNoGraphsWithNA(1);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(6);
  },
);

Scenario(
  'Verify MySQL Instances Overview Dashboard contains AWS RDS MySQL 5.6 filters @instances',
  async ({ I, dashboardPage, remoteInstancesPage }) => {
    const filters = remoteInstancesPage.rds;

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
    const metricNames = ['aws_rds_cpu_credit_usage_average', 'rds_exporter_requests_total', 'rdsosmetrics_cpuUtilization_system'];
    const serviceName = remoteInstancesPage.rds['Service Name'];
    const { node_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MYSQL_SERVICE', serviceName);
    const response = await inventoryAPI.apiGetAgentsViaNodeId(node_id);
    const result = response.data.rds_exporter[0];

    assert.ok(!result.push_metrics_enabled, `Push Metrics Enabled Flag Should not be present on response object for AWS RDS but found ${JSON.stringify(result)}`);
    for (const metric of metricNames) {
      await grafanaAPI.checkMetricExist(metric, { type: 'service_name', value: serviceName });
    }
  },
);
