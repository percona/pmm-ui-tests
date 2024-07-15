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
    await dashboardPage.applyFilter('Service Name', 'pdpgsql_');
    // Grab containerName from ServiceName
    const grabServiceName = await I.grabTextFrom('//label[@for="var-service_name"]//following-sibling::*');
    const partsServiceName = grabServiceName.split('_service');
    const containerServiceName = partsServiceName[0];

    await dashboardPage.expandEachDashboardRow();
    adminPage.performPageDown(5);
    adminPage.performPageUp(5);
    await dashboardPage.verifyMetricsExistence(dashboardPage.postgresqlInstanceSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
    await I.verifyCommand(`docker exec ${containerServiceName} pmm-admin list | grep "postgresql_pgstatmonitor_agent" | grep "Running"`);
    await I.verifyCommand(`docker exec ${containerServiceName} pmm-admin list | grep "postgres_exporter" | grep "Running"`);
  },
);
