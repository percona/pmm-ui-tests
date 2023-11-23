const assert = require('assert');

Feature('PMM + PDPGSQL Integration Scenarios');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1262 - Verify Postgresql Dashboard Instance Summary has Data @not-ui-pipeline @pdpgsql-pmm-integration',
  async ({
    I, dashboardPage, adminPage,
  }) => {
    I.amOnPage(dashboardPage.postgresqlInstanceSummaryDashboard.url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.applyFilter('Service Name', 'PDPGSQL_');
    await dashboardPage.expandEachDashboardRow();
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(5);
    adminPage.performPageUp(5);
    dashboardPage.verifyMetricsExistence(dashboardPage.postgresqlInstanceSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
    await I.verifyCommand('pmm-admin list | grep "postgresql_pgstatmonitor_agent" | grep "Running"');
    await I.verifyCommand('pmm-admin list | grep "postgres_exporter" | grep "Running"');
  },
);
