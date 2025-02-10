const assert = require('assert');
const { SERVICE_TYPE } = require('../helper/constants');

Feature('Integration tests for Percona Server & PMM');

Scenario(
  'PMM-T1982 - Verify Percona Server dashboard after PMM migration to V3 @not-ui-pipeline @pmm-migration',
  async ({
    I, dashboardPage, adminPage, inventoryAPI,
  }) => {
    const clientServiceName = (await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.POSTGRESQL, 'ps_8')).service_name;

    const url = I.buildUrlWithParams(dashboardPage.mysqlInstanceSummaryDashboard.clearUrl, { from: 'now-5m', to: 'now', service_name: clientServiceName });

    I.amOnPage(url);
    await dashboardPage.waitForDashboardOpened();
    adminPage.performPageDown(5);
    await dashboardPage.expandEachDashboardRow();
    adminPage.performPageUp(5);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(6);

    await inventoryAPI.verifyServiceExistsAndHasRunningStatus({
      serviceType: SERVICE_TYPE.MYSQL,
      service: 'mysql',
    }, clientServiceName);
  },
).retry(2);

Scenario(
  'PMM-T1983 - Verify QAN have data for Percona Server after PMM migration to V3 @not-ui-pipeline @pmm-migration',
  async ({
    I, queryAnalyticsPage, inventoryAPI,
  }) => {
    const clientServiceName = (await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.POSTGRESQL, 'ps_8')).service_name;
    const serviceList = [clientServiceName];

    console.log(`Serivce List is: ${JSON.stringify(serviceList)}`);

    for (const service of serviceList) {
      I.amOnPage(I.buildUrlWithParams(queryAnalyticsPage.url, { from: 'now-5m' }));
      queryAnalyticsPage.waitForLoaded();
      await adminPage.applyTimeRange('Last 12 hours');
      queryAnalyticsPage.waitForLoaded();
      await queryAnalyticsPage.filters.selectFilterInGroup(service, 'Service Name');
      queryAnalyticsPage.waitForLoaded();
      const count = await queryAnalyticsPage.data.getCountOfItems();

      assert.ok(count > 0, `The queries for service ${service} instance do NOT exist, check QAN Data`);
    }
  },
).retry(1);
