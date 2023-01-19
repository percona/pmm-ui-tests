const {
  inventoryAPI,
} = inject();
let services;
const serviceList = [];

Feature('Test Dashboards inside the PostgreSQL Folder');

BeforeSuite(async ({ I }) => {
  // Skipping PDPGSQL metric check due to bug
  // const pdpgsql_service_response = await inventoryAPI.apiGetNodeInfoForAllNodesByServiceName('POSTGRESQL_SERVICE', 'PDPGSQL_');

  const pgsql_service_response = await inventoryAPI.apiGetNodeInfoForAllNodesByServiceName('POSTGRESQL_SERVICE', 'PGSQL_');
  const pmm_server = await inventoryAPI.apiGetNodeInfoForAllNodesByServiceName('POSTGRESQL_SERVICE', 'pmm-server');

  // skipping PDPGSQL from services list too
  services = pmm_server.concat(pgsql_service_response);
  for (const nodeInfo of services) {
    serviceList.push(nodeInfo.service_name);
  }
});

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'Open the PostgreSQL Instance Summary Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, dashboardPage, adminPage }) => {
    I.say(serviceList);
    for (const serviceName of serviceList) {
      I.amOnPage(dashboardPage.postgresqlInstanceSummaryDashboard.url);
      dashboardPage.waitForDashboardOpened();
      await dashboardPage.applyFilter('Service Name', serviceName);
      await dashboardPage.expandEachDashboardRow();
      I.click(adminPage.fields.metricTitle);
      adminPage.performPageDown(5);
      adminPage.performPageUp(5);
      dashboardPage.verifyMetricsExistence(dashboardPage.postgresqlInstanceSummaryDashboard.metrics);
      await dashboardPage.verifyThereAreNoGraphsWithNA();
      // Change to 3 when https://jira.percona.com/browse/PMM-11425 is fixed
      await dashboardPage.verifyThereAreNoGraphsWithoutData(4);
    }
  },
);

Scenario.only(
  'PMM-T394 - PostgreSQL Instance Overview Dashboard metrics @nightly @dashboards',
  async ({ I, dashboardPage, adminPage }) => {
    for (const serviceName of serviceList) {
      I.amOnPage(dashboardPage.postgresqlInstanceOverviewDashboard.url);
      dashboardPage.waitForDashboardOpened();
      await dashboardPage.applyFilter('Service Name', serviceName);
      await dashboardPage.expandEachDashboardRow();
      I.click(adminPage.fields.metricTitle);
      adminPage.performPageDown(5);
      adminPage.performPageUp(5);
      dashboardPage.verifyMetricsExistence(dashboardPage.postgresqlInstanceOverviewDashboard.metrics);
      await dashboardPage.verifyThereAreNoGraphsWithNA();
      // Change to 1 when https://jira.percona.com/browse/PMM-10861 is fixed
      await dashboardPage.verifyThereAreNoGraphsWithoutData(2);
    }
  },
);

Scenario(
  'PMM-T394 - PostgreSQL Instance Compare Dashboard metrics @nightly @dashboards',
  async ({ I, dashboardPage, adminPage }) => {
    I.amOnPage(dashboardPage.postgresqlInstanceCompareDashboard.url);
    dashboardPage.waitForDashboardOpened();
    for (const serviceName of serviceList) {
      await dashboardPage.applyFilter('Service Name', serviceName);
    }

    await dashboardPage.expandEachDashboardRow();
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(5);
    adminPage.performPageUp(5);
    dashboardPage.verifyMetricsExistence(dashboardPage.postgresqlInstanceCompareDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
  },
);
