Feature('Verify Prometheus Overview Dashboard');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1943 Verify CPU and Memory Usage for each agents on Prometheus Overview status dashboard @dashboards',
  async ({ I, dashboardPage }) => {
    I.amOnPage(I.buildUrlWithParams(dashboardPage.prometheusExporterOverviewDashboard.cleanUrl, { from: 'now-3h' }));
    // dashboardPage.waitForDashboardOpened();
    await dashboardPage.prometheusExporterOverviewDashboard.getGraphValues('CPU Usage', 100);
    I.saveScreenshot('PMM-T1943.png');
  },
);
