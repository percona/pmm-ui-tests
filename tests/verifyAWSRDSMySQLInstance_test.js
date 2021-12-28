const assert = require('assert');

const { remoteInstancesPage } = inject();

Feature('Monitoring AWS RDS MySQL DB');

const instances = new DataTable(['version', 'instanceId']);

instances.add(['mysql57', remoteInstancesPage.mysql57rds['Service Name']]);
instances.add(['mysql80', remoteInstancesPage.mysql8rds['Service Name']]);
instances.add(['mysql56', remoteInstancesPage.rds['Service Name']]);

Before(async ({ I }) => {
  await I.Authorize();
});

Data(instances).Scenario(
  'PMM-T138 Verify disabling enhanced metrics for RDS, PMM-T139 Verify disabling basic metrics for RDS, PMM-T9 Verify adding RDS instances [critical] @instances',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, current,
  }) => {
    const instanceIdToMonitor = current.instanceId;

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
    await pmmInventoryPage.verifyMetricsFlags(instanceIdToMonitor);
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

Data(instances).Scenario(
  'Verify AWS RDS MySQL instance has status running [critical] @instances',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, current,
  }) => {
    const serviceName = current.instanceId;

    I.amOnPage(pmmInventoryPage.url);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(serviceName);
    await pmmInventoryPage.verifyAgentHasStatusRunning(serviceName);
  },
);

// Skipping the tests because QAN does not get any data right after instance was added for monitoring
xScenario(
  'Verify QAN Filters contain AWS RDS MySQL after it was added for monitoring @instances',
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

Data(instances).Scenario(
  'Verify MySQL Instances Overview Dashboard for AWS RDS MySQL data after it was added for monitoring @instances',
  async ({ I, dashboardPage, current }) => {
    const serviceName = current.instanceId;

    I.amOnPage(dashboardPage.mySQLInstanceOverview.urlWithRDSFilter(serviceName));
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyThereAreNoGraphsWithNA(1);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(6);
  },
);

Scenario(
  'Verify MySQL Instances Overview Dashboard contains AWS RDS MySQL filters @instances',
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

Data(instances).Scenario(
  'PMM-T603 Verify MySQL RDS exporter is running in pull mode @instances',
  async ({
    I, dashboardPage, remoteInstancesPage, inventoryAPI, current,
  }) => {
    const metricNames = ['aws_rds_cpu_credit_usage_average', 'rds_exporter_requests_total', 'rdsosmetrics_cpuUtilization_system'];
    const serviceName = current.instanceId;
    const { node_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MYSQL_SERVICE', serviceName);
    const response = await inventoryAPI.apiGetAgentsViaNodeId(node_id);
    const result = response.data.rds_exporter[0];

    assert.ok(!result.push_metrics_enabled, `Push Metrics Enabled Flag Should not be present on response object for AWS RDS but found ${JSON.stringify(result)}`);

    for (const metric of metricNames) {
      const response = await dashboardPage.checkMetricExist(metric, { type: 'service_name', value: serviceName });

      console.log(JSON.stringify(response.data.data.result));
      const result = JSON.stringify(response.data.data.result);

      assert.ok(response.data.data.result.length !== 0, `Metrics ${metric} from ${serviceName} should be available but got empty ${result}`);
    }
  },
);
