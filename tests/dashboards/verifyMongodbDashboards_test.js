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
    I, dashboardPage, inventoryAPI, adminPage,
  }) => {
    const mongoService = await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.MONGODB, 'rs101');

    I.amOnPage(I.buildUrlWithParams(dashboardPage.mongoDbCollectionsOverview.clearUrl, {
      from: 'now-5m',
      service_name: mongoService.service_name,
      refresh: '10s',
    }));
    dashboardPage.waitForDashboardOpened();
    await adminPage.performPageDown(5);
    await dashboardPage.verifyMetricsExistence(dashboardPage.mongoDbCollectionsOverview.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
  },
).retry(2);

const fcvPanelTestData = () => {
  const { dashboardPage } = inject();

  return [dashboardPage.mongodbReplicaSetSummaryDashboard.cleanUrl, dashboardPage.mongoDbShardedClusterSummary.url];
};

Data(fcvPanelTestData()).Scenario(
  'PMM-T2035 - Verify MongoDb Cluster and MongoDB ReplSet dashboards has FCV panel @nightly @dashboards',
  async ({ I, dashboardPage, current }) => {
    const url = I.buildUrlWithParams(current, {
      from: 'now-5m',
      cluster: 'sharded',
    });

    I.amOnPage(url);
    dashboardPage.waitForDashboardOpened();
    const text = await I.grabTextFrom(dashboardPage.panelValueByTitle('Feature Compatibility Version'));
    console.log(`Text is: ${text}`);
    console.log(`MongoDB version is: ${process.env.PSMDB_VERSION}`);
  },
);
