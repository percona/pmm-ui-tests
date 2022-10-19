Feature('MongoDB Experimental Dashboards tests');

const { adminPage } = inject();
const pmmFrameworkLoader = `bash ${adminPage.pathToFramework}`;
const pathToPMMFramework = adminPage.pathToPMMTests;
const connection = {
  // eslint-disable-next-line no-inline-comments
  port: '27017', // This is the port used by --addclient=mo,1 --with-replica --mongomagic
  container_name: 'psmdb_pmm',
};
const mongodb_service_name_ac = 'mongodb_service_all_collectors';

BeforeSuite(async ({ I, grafanaAPI }) => {
  await I.verifyCommand(`${pmmFrameworkLoader} --with-replica --mongomagic --pmm2 --mo-version=4.4`);
  connection.container_name = await I.verifyCommand('docker ps --format "table {{.ID}}\\t{{.Image}}\\t{{.Names}}" | grep \'psmdb\' | awk -F " " \'{print $3}\'');
  connection.port = await I.verifyCommand(`docker exec ${connection.container_name} pmm-admin list | grep mongodb_rs1_1 | awk -F " " '{print $3}' | awk -F ":" '{print $2}'`);
  await I.verifyCommand(`docker cp ./testdata/mongodb/testCollections.js  ${connection.container_name}:/`);
  await I.verifyCommand(`docker exec ${connection.container_name} /nodes/cl_primary.sh testCollections.js`);
  await I.verifyCommand(`docker exec ${connection.container_name} pmm-admin add mongodb --cluster mongodb_node_cluster --replication-set=rs1 --environment=mongodb_rs_node --port=${connection.port} --service-name=${mongodb_service_name_ac} --enable-all-collectors --max-collections-limit=2000`);
  await grafanaAPI.waitForMetric('mongodb_up', { type: 'service_name', value: mongodb_service_name_ac }, 65);
});

Before(async ({ I }) => {
  await I.Authorize();
});

AfterSuite(async ({ I }) => {
  await I.verifyCommand(`docker exec ${connection.container_name} pmm-admin remove mongodb ${mongodb_service_name_ac} || true`);
});

Scenario(
  'PMM-T1332 - Verify MongoDB - MongoDB Collection Details @dashboards @mongodb-exporter',
  async ({
    I, grafanaAPI, adminPage, homePage, dashboardPage, searchDashboardsModal,
  }) => {
    I.amOnPage(I.buildUrlWithParams(dashboardPage.mongoDbCollectionDetails.clearUrl, { from: 'now-5m' }));
    dashboardPage.waitForDashboardOpened();
    dashboardPage.setTimeRange();
    await dashboardPage.changeServiceName(`${mongodb_service_name_ac}`);
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(2);
    adminPage.performPageUp(2);
    I.seeTextEquals('The next two graphs are available only when --enable-all-collectors option is used in pmm-admin.', locate('$TextPanel-converted-content').as('Explanation text field'));
    dashboardPage.verifyMetricsExistence(dashboardPage.mongoDbCollectionDetails.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
  },
);

Scenario(
  'PMM-T1333 - Verify MongoDB - MongoDB Collections Overview @dashboards @mongodb-exporter',
  async ({
    I, grafanaAPI, adminPage, homePage, dashboardPage, searchDashboardsModal,
  }) => {
    I.amOnPage(I.buildUrlWithParams(dashboardPage.mongoDbCollectionsOverview.clearUrl, { from: 'now-5m' }));
    dashboardPage.waitForDashboardOpened();
    dashboardPage.setTimeRange();
    await dashboardPage.changeServiceName(`${mongodb_service_name_ac}`);
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(3);
    adminPage.performPageUp(3);
    dashboardPage.verifyMetricsExistence(dashboardPage.mongoDbCollectionsOverview.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
  },
);

Scenario(
  'PMM-T1334 - Verify MongoDB - MongoDB Oplog Details @dashboards @mongodb-exporter',
  async ({
    I, adminPage, homePage, dashboardPage, searchDashboardsModal,
  }) => {
    I.amOnPage(I.buildUrlWithParams(dashboardPage.mongoDbOplogDetails.clearUrl, { from: 'now-5m' }));
    dashboardPage.waitForDashboardOpened();
    dashboardPage.setTimeRange();
    await dashboardPage.changeServiceName(`${mongodb_service_name_ac}`);
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(3);
    adminPage.performPageUp(3);
    dashboardPage.verifyMetricsExistence(dashboardPage.mongoDbOplogDetails.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
  },
);
