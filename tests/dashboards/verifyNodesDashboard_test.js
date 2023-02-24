Feature('Test Dashboards inside the Nodes Folder');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1633 Verify Node Overview Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, dashboardPage }) => {
    await I.amOnPage(dashboardPage.nodeOverviewDashboard.url);
    await dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyMetricsExistence(dashboardPage.nodeOverviewDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(3);
    await dashboardPage.verifyHexagonalGraphsHaveData();
  },
);

Scenario(
  'PMM-T65 Verify Node Summary Dashboard metrics @nightly @dashboards',
  async ({ I, dashboardPage, adminPage }) => {
    await I.amOnPage(dashboardPage.newNodeSummaryDashboard.url);

    await dashboardPage.waitForDashboardOpened();
    await I.waitForVisible(dashboardPage.hexagonalGraphHeader);
    await I.click(dashboardPage.hexagonalGraphHeader);
    await dashboardPage.expandEachDashboardRow();
    await adminPage.performPageDown(5);
    await dashboardPage.verifyMetricsExistence(dashboardPage.newNodeSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData();
    await adminPage.performPageUp(5);
    await dashboardPage.verifyHexagonalGraphsHaveData();
  },
);
