Feature('VictoriaMetrics Dashboards');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T506 Verify metrics on VictoriaMetrics dashboard @nightly @dashboards',
  async ({ I, dashboardPage, adminPage }) => {
    I.amOnPage(dashboardPage.victoriaMetricsDashboard.url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    I.click(adminPage.fields.metricTitle);
    adminPage.peformPageDown(5);
    dashboardPage.verifyMetricsExistence(dashboardPage.victoriaMetricsDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA(0);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
  },
);

Scenario(
  'PMM-T507 Verify metrics on VM Agents Overview Dashboard @nightly @dashboards',
  async ({ I, dashboardPage, adminPage }) => {
    I.amOnPage(dashboardPage.victoriaMetricsAgentsOverviewDashboard.url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    I.click(adminPage.fields.metricTitle);
    adminPage.peformPageDown(5);
    dashboardPage.verifyMetricsExistence(dashboardPage.victoriaMetricsAgentsOverviewDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA(0);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(0);
  },
);
