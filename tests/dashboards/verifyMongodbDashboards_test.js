Feature('Test Dashboards inside the MongoDB Folder');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T307 Open the MongoDB Instances Overview Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, dashboardPage }) => {
    I.amOnPage(dashboardPage.mongoDbInstanceOverview.url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyMetricsExistence(dashboardPage.mongoDbInstanceOverview.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(3);
    await dashboardPage.verifyHexagonalGraphsHaveData();
  },
);

Scenario(
  'PMM-T305 Open the MongoDB Instance Summary Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards ',
  async ({ I, dashboardPage }) => {
    I.amOnPage(dashboardPage.mongodbOverviewDashboard.url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyMetricsExistence(dashboardPage.mongodbOverviewDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData();
  },
);

Scenario(
  'Open the MongoDB Cluster Summary Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, adminPage, dashboardPage }) => {
    I.amOnPage(dashboardPage.mongoDbClusterSummaryDashboard.url);
    dashboardPage.waitForDashboardOpened();
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(1);
    await dashboardPage.expandEachDashboardRow();
    dashboardPage.verifyMetricsExistence(dashboardPage.mongoDbClusterSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(12);
    await dashboardPage.verifyHexagonalGraphsHaveData();
  },
);
