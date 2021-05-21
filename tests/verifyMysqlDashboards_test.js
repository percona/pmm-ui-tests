const assert = require('assert');

Feature('Test Dashboards inside the MySQL Folder');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'Open the MySQL Overview Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, adminPage, dashboardPage }) => {
    I.amOnPage(dashboardPage.mysqlInstanceSummaryDashboard.url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.applyFilter('Service Name', 'ps_8.0');
    await dashboardPage.expandEachDashboardRow();
    I.click(adminPage.fields.metricTitle);
    adminPage.peformPageDown(5);
    dashboardPage.verifyMetricsExistence(dashboardPage.mysqlInstanceSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA(1);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(5);
  },
);

Scenario(
  'Open the ProxySQL Instance Summary Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, adminPage, dashboardPage }) => {
    I.amOnPage(`${dashboardPage.proxysqlInstanceSummaryDashboard.url}?from=now-5m&to=now`);
    dashboardPage.waitForDashboardOpened();
    I.click(adminPage.fields.metricTitle);
    adminPage.peformPageDown(5);
    await dashboardPage.verifyMetricsExistence(dashboardPage.proxysqlInstanceSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(8);
  },
);

Scenario(
  'Open the PXCGalera Cluster Summary Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, adminPage, dashboardPage }) => {
    I.amOnPage(`${dashboardPage.pxcGaleraClusterSummaryDashboard.url}?from=now-5m&to=now`);
    dashboardPage.waitForDashboardOpened();
    I.click(adminPage.fields.metricTitle);
    adminPage.peformPageDown(5);
    dashboardPage.verifyMetricsExistence(dashboardPage.pxcGaleraClusterSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(2);
  },
);

Scenario(
  'PMM-T324 - Verify MySQL - MySQL User Details dashboard @nightly @dashboards',
  async ({ I, dashboardPage, adminPage }) => {
    I.amOnPage(dashboardPage.mysqlUserDetailsDashboard.url);
    dashboardPage.waitForDashboardOpened();
    adminPage.peformPageDown(5);
    await dashboardPage.expandEachDashboardRow();
    adminPage.performPageUp(5);
    dashboardPage.verifyMetricsExistence(dashboardPage.mysqlUserDetailsDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
  },
);

// Need to Skip due to wait issue on locator
xScenario(
  'PMM-T396 - Verify that parameters are passed from MySQL User Details dashboard to QAN @nightly @dashboards',
  async ({
    I, dashboardPage, qanFilters, adminPage,
  }) => {
    const filters = ['ps_8.0', 'root'];
    const timeRange = 'Last 12 hours';

    I.amOnPage(dashboardPage.mysqlUserDetailsDashboard.url);
    dashboardPage.waitForDashboardOpened();
    I.waitForVisible(dashboardPage.fields.timeRangePickerButton, 20);
    adminPage.applyTimeRange(timeRange);
    await dashboardPage.applyFilter('Service Name', 'ps_8.0');
    I.waitForVisible(dashboardPage.fields.rootUser, 20);
    I.click(dashboardPage.fields.rootUser);
    I.waitForVisible(dashboardPage.fields.dataLinkForRoot);
    I.click(dashboardPage.fields.dataLinkForRoot);
    await dashboardPage.waitAndSwitchTabs(2);
    I.waitForVisible(qanFilters.buttons.showSelected, 60);
    I.waitInUrl('&var-username=root', 30);
    I.waitInUrl('from=now-12h&to=now', 30);
    I.waitForVisible(qanFilters.buttons.showSelected, 60);
    await qanFilters.verifySelectedFilters(filters);
    const timeRangeGrabbed = await dashboardPage.getTimeRange();

    assert.equal(
      timeRangeGrabbed.slice(0, timeRangeGrabbed.length - 1),
      timeRange,
      `Grabbed time range: ${timeRangeGrabbed.slice(
        0,
        timeRangeGrabbed.length - 1,
      )} is not equal to expected time Range: ${timeRange}`,
    );
  },
);

Scenario(
  'PMM-T348 - PXC/Galera Node Summary dashboard @dashboards @nightly',
  async ({ I, dashboardPage, adminPage }) => {
    I.amOnPage(`${dashboardPage.mysqlPXCGaleraNodeSummaryDashboard.url}&from=now-15m&to=now`);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.applyFilter('Service Name', 'pxc_node_8.0');
    adminPage.peformPageDown(5);
    dashboardPage.verifyMetricsExistence(dashboardPage.mysqlPXCGaleraNodeSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(2);
  },
);

Scenario(
  'PMM-T349 - PXC/Galera Nodes Compare dashboard @dashboards @nightly',
  async ({ I, dashboardPage, adminPage }) => {
    I.amOnPage(`${dashboardPage.mysqlPXCGaleraNodesSummaryDashboard.url}&from=now-15m&to=now`);
    dashboardPage.waitForDashboardOpened();
    adminPage.peformPageDown(5);
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.applyFilter('Service Name', 'pxc');
    adminPage.performPageUp(5);
    dashboardPage.verifyMetricsExistence(dashboardPage.mysqlPXCGaleraNodesSummaryDashboard.metrics);
    dashboardPage.verifyTabExistence(dashboardPage.mysqlPXCGaleraNodesSummaryDashboard.tabs);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(3);
  },
);

Scenario(
  'Verify metrics on Group Replication Summary Dashboard @dashboards @nightly',
  async ({ I, dashboardPage, adminPage }) => {
    I.amOnPage(dashboardPage.groupReplicationDashboard.url);
    dashboardPage.waitForDashboardOpened();
    adminPage.peformPageDown(5);
    await dashboardPage.expandEachDashboardRow();
    adminPage.performPageUp(5);
    dashboardPage.verifyMetricsExistence(dashboardPage.groupReplicationDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(3);
  },
);

Scenario(
  'PMM-T671 - Verify MySQL summary is displayed on MySQL Instance Summary dashboard @nightly',
  async ({ I, dashboardPage }) => {
    I.amOnPage(dashboardPage.mysqlInstanceSummaryDashboard.url);
    dashboardPage.waitForDashboardOpened();
    I.waitForVisible(dashboardPage.fields.serviceSummary, 30);
    I.click(dashboardPage.fields.serviceSummary);
    I.waitForVisible(dashboardPage.fields.mySQLServiceSummaryContent, 120);
  },
);
