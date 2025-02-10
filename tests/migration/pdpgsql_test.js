const assert = require('assert');
const { SERVICE_TYPE } = require('../helper/constants');

Feature('Postgres Tests after PMM migration to V3');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1980 - Verify Postgres dashboard after PMM migration to V3 @pmm-migration',
  async ({
    I, dashboardPage, inventoryAPI,
  }) => {
    const service = (await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.POSTGRESQL, 'PDPGSQL_'));

    I.amOnPage(I.buildUrlWithParams(dashboardPage.postgresqlInstanceSummaryDashboard.cleanUrl, { from: 'now-5m', service_name: service.service_name }));
    await dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyMetricsExistence(dashboardPage.postgresqlInstanceSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData();
    await I.verifyCommand('pmm-admin list | grep "postgresql_pgstatmonitor_agent" | grep "Running"');
    await I.verifyCommand('pmm-admin list | grep "postgres_exporter" | grep "Running"');

    await inventoryAPI.verifyServiceExistsAndHasRunningStatus({
      serviceType: SERVICE_TYPE.POSTGRESQL,
      service: 'postgresql',
    }, service.service_name);
  },
).retry(3);

Scenario(
  'PMM-T1981 - Verify QAN for Postgres after PMM migration to V3 @not-ui-pipeline @pmm-migration',
  async ({
    I, queryAnalyticsPage, inventoryAPI, adminPage,
  }) => {
    const clientServiceName = (await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.POSTGRESQL, 'PDPGSQL_')).service_name;

    I.amOnPage(I.buildUrlWithParams(queryAnalyticsPage.url, { from: 'now-5m' }));
    queryAnalyticsPage.waitForLoaded();
    await adminPage.applyTimeRange('Last 12 hours');
    queryAnalyticsPage.waitForLoaded();
    await queryAnalyticsPage.filters.selectFilterInGroup(clientServiceName, 'Service Name');
    queryAnalyticsPage.waitForLoaded();
    const count = await queryAnalyticsPage.data.getCountOfItems();

    assert.ok(count > 0, `The queries for service ${clientServiceName} instance do NOT exist, check QAN Data`);
  },
).retry(1);
