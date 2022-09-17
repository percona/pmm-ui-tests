Feature('Test Dashboards inside the Insights Folder');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'Open Advanced Exploration Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, dashboardPage, adminPage }) => {
    I.amOnPage(dashboardPage.advancedDataExplorationDashboard.url);
    dashboardPage.waitForDashboardOpened();
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(5);
    dashboardPage.verifyMetricsExistence(dashboardPage.advancedDataExplorationDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
  },
);

Scenario(
  'Open the Prometheus Exporters Status Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, dashboardPage, adminPage }) => {
    I.amOnPage(dashboardPage.prometheusExporterStatusDashboard.url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.applyFilter('Node Name', 'pmm-server');
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(5);
    await dashboardPage.expandEachDashboardRow();
    dashboardPage.verifyMetricsExistence(dashboardPage.prometheusExporterStatusDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA(4);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(16);
  },
);

Scenario(
  'PMM-T300 Open the Prometheus Exporters Overview Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, dashboardPage, adminPage }) => {
    I.amOnPage(dashboardPage.prometheusExporterOverviewDashboard.url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.applyFilter('Node Name', 'pmm-server');
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(5);
    dashboardPage.verifyMetricsExistence(dashboardPage.prometheusExporterOverviewDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA(6);
    await dashboardPage.verifyThereAreNoGraphsWithoutData();
  },
);
