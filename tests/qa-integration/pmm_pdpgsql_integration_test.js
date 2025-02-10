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
    let service = (await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.POSTGRESQL, 'PDPGSQL_'));

    if (!service) {
      service = (await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.POSTGRESQL, 'pdpgsql_'));
    }

    I.amOnPage(I.buildUrlWithParams(dashboardPage.postgresqlInstanceSummaryDashboard.cleanUrl, { from: 'now-5m', service_name: service.service_name }));
    await dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyMetricsExistence(dashboardPage.postgresqlInstanceSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData();
    if (process.env.JOB_NAME === 'pmm3-migration-tests') {
      await I.verifyCommand('pmm-admin list | grep "postgresql_pgstatmonitor_agent" | grep "Running"');
      await I.verifyCommand('pmm-admin list | grep "postgres_exporter" | grep "Running"');
    } else {
      const containerServiceName = await I.verifyCommand('docker ps -f name=pdpgsql --format "{{ .Names }}"');

      await I.verifyCommand(`docker exec ${containerServiceName} pmm-admin list | grep "postgresql_pgstatmonitor_agent" | grep "Running"`);
      await I.verifyCommand(`docker exec ${containerServiceName} pmm-admin list | grep "postgres_exporter" | grep "Running"`);
    }

    await inventoryAPI.verifyServiceExistsAndHasRunningStatus({
      serviceType: SERVICE_TYPE.POSTGRESQL,
      service: 'postgresql',
    }, service.service_name);
  },
).retry(3);

Scenario(
  'Verify QAN after PDPGSQL Instances is added @pdpgsql-pmm-integration @not-ui-pipeline @pmm-migration',
  async ({
    I, queryAnalyticsPage, inventoryAPI, adminPage,
  }) => {
    let clientServiceName = (await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.POSTGRESQL, 'PDPGSQL_')).service_name;

    if (!clientServiceName) {
      clientServiceName = (await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.POSTGRESQL, 'pdpgsql_')).service_name;
    }

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
