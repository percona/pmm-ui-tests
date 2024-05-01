const assert = require('assert');

Feature('MongoDB Experimental Dashboards tests');

let mongodb_service_name_ac;
const containerName = 'rs101';

BeforeSuite(async ({ I, inventoryAPI }) => {
  const mongoService = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', 'rs101');

  mongodb_service_name_ac = mongoService.service_name;

  // check that rs101 docker container exists
  const dockerCheck = await I.verifyCommand(`docker ps | grep ${containerName}`);

  assert.ok(dockerCheck.includes(containerName), 'rs101 docker container should exist. please run pmm-framework with "--mongo-replica-for-backup" flag');
});

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1332 - Verify MongoDB - MongoDB Collection Details @dashboards @mongodb-exporter',
  async ({
    I, dashboardPage,
  }) => {
    I.amOnPage(I.buildUrlWithParams(dashboardPage.mongoDbCollectionDetails.clearUrl, { from: 'now-5m', service_name: mongodb_service_name_ac }));
    dashboardPage.waitForDashboardOpened();
    I.seeTextEquals('The next two graphs are available only when --enable-all-collectors option is used in pmm-admin. Graph Top 5 Collection by Documents Changed displays data only on selecting the Primary node.', locate('$TextPanel-converted-content').as('Explanation text field'));
    await dashboardPage.verifyMetricsExistence(dashboardPage.mongoDbCollectionDetails.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(2);
  },
);

Scenario(
  'PMM-T1333 - Verify MongoDB - MongoDB Collections Overview @dashboards @mongodb-exporter',
  async ({
    I, dashboardPage,
  }) => {
    I.amOnPage(I.buildUrlWithParams(dashboardPage.mongoDbCollectionsOverview.clearUrl, { from: 'now-5m', service_name: mongodb_service_name_ac }));
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.verifyMetricsExistence(dashboardPage.mongoDbCollectionsOverview.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
  },
);

Scenario(
  'PMM-T1334 - Verify MongoDB - MongoDB Oplog Details @dashboards @mongodb-exporter',
  async ({
    I, dashboardPage,
  }) => {
    I.amOnPage(I.buildUrlWithParams(dashboardPage.mongoDbOplogDetails.clearUrl, { from: 'now-5m', service_name: mongodb_service_name_ac }));
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.verifyMetricsExistence(dashboardPage.mongoDbOplogDetails.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
  },
);
