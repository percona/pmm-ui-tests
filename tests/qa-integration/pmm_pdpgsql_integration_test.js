const assert = require('assert');
const { SERVICE_TYPE } = require('../helper/constants');

Feature('PMM + PDPGSQL Integration Scenarios');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1262 - Verify Postgresql Dashboard Instance Summary has Data @not-ui-pipeline @pdpgsql-pmm-integration @pmm-migration',
  async ({
    I, dashboardPage, adminPage,
  }) => {
    I.amOnPage(dashboardPage.postgresqlInstanceSummaryDashboard.url);
    await dashboardPage.waitForDashboardOpened();
    await dashboardPage.applyFilter('Service Name', 'pdpgsql_');
    // Grab containerName from ServiceName
    const grabServiceName = await I.grabTextFrom('//label[@for="var-service_name"]//following-sibling::*');
    const partsServiceName = grabServiceName.split('_service');
    const containerServiceName = partsServiceName[0];
    I.wait(60);
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyMetricsExistence(dashboardPage.postgresqlInstanceSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData();
    await I.verifyCommand(`docker exec ${containerServiceName} pmm-admin list | grep "postgresql_pgstatmonitor_agent" | grep "Running"`);
    await I.verifyCommand(`docker exec ${containerServiceName} pmm-admin list | grep "postgres_exporter" | grep "Running"`);
  },
).retry(3);
