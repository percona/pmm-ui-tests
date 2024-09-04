const assert = require('assert');

Feature('MongoDB Experimental Dashboards tests');

Before(async ({ I }) => {
  await I.Authorize();
});

// TODO: update the test to use new Cluster Summary dashboard https://github.com/percona/grafana-dashboards/pull/1611
Scenario.skip(
  'PMM-T1332 - Verify MongoDB - MongoDB Collection Details @nightly',
  async ({
    I, adminPage, dashboardPage, inventoryAPI,
  }) => {
    const service_response = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', 'rs1_1');

    I.amOnPage(I.buildUrlWithParams(dashboardPage.mongoDbCollectionDetails.clearUrl, { from: 'now-5m', service_name: service_response.service_name }));
    dashboardPage.waitForDashboardOpened();
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(2);
    adminPage.performPageUp(2);
    I.seeTextEquals('The next two graphs are available only when --enable-all-collectors option is used in pmm-admin. Graph Top 5 Collection by Documents Changed displays data only on selecting the Primary node.', locate('$TextPanel-converted-content').as('Explanation text field'));
    dashboardPage.verifyMetricsExistence(dashboardPage.mongoDbCollectionDetails.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(2);
  },
);

Scenario(
  'PMM-T1333 - Verify MongoDB - MongoDB Collections Overview @nightly',
  async ({
    I, adminPage, dashboardPage, inventoryAPI,
  }) => {
    const service_response = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', 'rs1_1');

    I.amOnPage(I.buildUrlWithParams(dashboardPage.mongoDbCollectionsOverview.clearUrl, { from: 'now-5m', service_name: service_response.service_name }));
    dashboardPage.waitForDashboardOpened();
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(4);
    adminPage.performPageUp(4);
    dashboardPage.verifyMetricsExistence(dashboardPage.mongoDbCollectionsOverview.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
  },
);

Scenario(
  'PMM-T1334 - Verify MongoDB - MongoDB Oplog Details @nightly',
  async ({
    I, adminPage, dashboardPage, inventoryAPI,
  }) => {
    const service_response = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', 'rs1_1');

    I.amOnPage(I.buildUrlWithParams(dashboardPage.mongoDbOplogDetails.clearUrl, { from: 'now-5m', service_name: service_response.service_name }));
    dashboardPage.waitForDashboardOpened();
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(3);
    adminPage.performPageUp(3);
    dashboardPage.verifyMetricsExistence(dashboardPage.mongoDbOplogDetails.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
  },
);
