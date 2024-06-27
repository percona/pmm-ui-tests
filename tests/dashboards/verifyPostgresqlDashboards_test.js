const { SERVICE_TYPE } = require("../helper/constants");

const {
  inventoryAPI,
} = inject();
let services;
const serviceList = [];

Feature('Test Dashboards inside the PostgreSQL Folder');

BeforeSuite(async ({ I }) => {
  const pdpgsql_service_response = await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.POSTGRESQL, 'pdpgsql_');
  const pgsql_service_response = await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.POSTGRESQL, 'pgsql_');
  const pmm_server = await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.POSTGRESQL, 'pmm-server-postgresql');

  serviceList.push(pdpgsql_service_response.service_name);
  serviceList.push(pgsql_service_response.service_name);
  serviceList.push(pmm_server.service_name);
});

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'Open the PostgreSQL Instance Summary Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, dashboardPage, adminPage }) => {
    I.say(serviceList);
    for (const serviceName of serviceList) {
      const url = I.buildUrlWithParams(
        dashboardPage.postgresqlInstanceSummaryDashboard.cleanUrl,
        { service_name: serviceName, from: 'now-5m' },
      );

      I.amOnPage(url);
      dashboardPage.waitForDashboardOpened();
      await dashboardPage.expandEachDashboardRow();
      await dashboardPage.verifyMetricsExistence(dashboardPage.postgresqlInstanceSummaryDashboard.metrics);
      await dashboardPage.verifyThereAreNoGraphsWithoutData();
    }
  },
);

Scenario(
  'PMM-T394 - PostgreSQL Instance Overview Dashboard metrics @nightly @dashboards',
  async ({ I, dashboardPage }) => {
    for (const serviceName of serviceList) {
      const url = I.buildUrlWithParams(
        dashboardPage.postgresqlInstanceOverviewDashboard.cleanUrl,
        { service_name: serviceName, from: 'now-5m' },
      );

      I.amOnPage(url);
      dashboardPage.waitForDashboardOpened();
      await dashboardPage.expandEachDashboardRow();
      await dashboardPage.verifyMetricsExistence(dashboardPage.postgresqlInstanceOverviewDashboard.metrics);
      await dashboardPage.verifyThereAreNoGraphsWithoutData();
    }
  },
);

Scenario(
  'PMM-T394 - PostgreSQL Instance Compare Dashboard metrics @nightly @dashboards',
  async ({ I, dashboardPage, adminPage }) => {
    const url = I.buildUrlWithParams(
      dashboardPage.postgresqlInstanceCompareDashboard.cleanUrl,
      {
        from: 'now-5m',
        service_name: 'All',
        refresh: '1h',
      },
    );

    I.amOnPage(url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyMetricsExistence(dashboardPage.postgresqlInstanceCompareDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData();
  },
);
