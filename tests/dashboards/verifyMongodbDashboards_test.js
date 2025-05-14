const { SERVICE_TYPE } = require('../helper/constants');

Feature('Test Dashboards inside the MongoDB Folder');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T305 - Open the MongoDB Instance Summary Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, dashboardPage }) => {
    const url = I.buildUrlWithParams(dashboardPage.mongodbOverviewDashboard.url, {
      from: 'now-5m',
      cluster: 'replicaset',
    });

    I.amOnPage(url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyMetricsExistence(dashboardPage.mongodbOverviewDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData();
  },
);

// unskip after sharded cluster setup is available in the framework
Scenario.skip(
  'Open the MongoDB Cluster Summary Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, dashboardPage }) => {
    I.amOnPage(I.buildUrlWithParams(dashboardPage.mongoDbClusterSummaryDashboard.url, {
      cluster: 'sharded',
      from: 'now-5m',
    }));
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyMetricsExistence(dashboardPage.mongoDbClusterSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData();
  },
);

Scenario(
  'PMM-T1698 - Verify that Disk I/O and Swap Activity and Network Traffic panels have graphs if Node name contains dot symbol @nightly @dashboards',
  async ({ I, dashboardPage }) => {
    const url = I.buildUrlWithParams(dashboardPage.mongodbReplicaSetSummaryDashboard.cleanUrl, {
      from: 'now-5m',
      cluster: 'replicaset',
    });

    I.amOnPage(url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyMetricsExistencePartialMatch(dashboardPage.mongodbReplicaSetSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(6);
  },
);

Scenario(
  'PMM-T1333 - Verify MongoDB - MongoDB Collections Overview @mongodb-exporter @nightly',
  async ({
    I, dashboardPage, inventoryAPI,
  }) => {
    const mongoService = await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.MONGODB, 'rs101');

    I.amOnPage(I.buildUrlWithParams(dashboardPage.mongoDbCollectionsOverview.clearUrl, { from: 'now-5m', service_name: mongoService.service_name }));
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.verifyMetricsExistence(dashboardPage.mongoDbCollectionsOverview.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
  },
).retry(2);
