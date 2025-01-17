const assert = require('assert');
const { SERVICE_TYPE } = require('../helper/constants');

Feature('PMM + PDPGSQL Integration Scenarios');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1262 - Verify Postgresql Dashboard Instance Summary has Data @not-ui-pipeline @pdpgsql-pmm-integration @pmm-migration',
  async ({
    I, dashboardPage, inventoryAPI,
  }) => {
    const clientServiceName = (await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.POSTGRESQL, 'PDGPGSQL_')).service_name;

    console.log(`PDPGSQL client service name is: ${clientServiceName}`);

    I.amOnPage(I.buildUrlWithParams(dashboardPage.postgresqlInstanceSummaryDashboard.cleanUrl, { from: 'now-5m', service_name: clientServiceName }));
    await dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyMetricsExistence(dashboardPage.postgresqlInstanceSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData();
    await I.verifyCommand('pmm-admin list | grep "postgresql_pgstatmonitor_agent" | grep "Running"');
    await I.verifyCommand('pmm-admin list | grep "postgres_exporter" | grep "Running"');
  },
).retry(3);
