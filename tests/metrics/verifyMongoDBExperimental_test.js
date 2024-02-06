const assert = require('assert');

Feature('MongoDB Experimental Dashboards tests');

const { adminPage } = inject();
const pmmFrameworkLoader = `bash ${adminPage.pathToFramework}`;
const connection = {
  // eslint-disable-next-line no-inline-comments
  port: '27017', // This is the port used by --addclient=mo,1 --with-replica --mongomagic
  container_name: 'psmdb_pmm',
};
const mongodb_service_name_ac = 'mongodb_service_all_collectors';
const mongodbDockerComposeServiceName = 'mongo_docker_compose';

BeforeSuite(async ({ I, grafanaAPI, remoteInstancesHelper }) => {
  await I.verifyCommand(`${pmmFrameworkLoader} --with-replica --mongomagic --pmm2 --mo-version=4.4`);
  connection.container_name = await I.verifyCommand('docker ps --format "table {{.ID}}\\t{{.Image}}\\t{{.Names}}" | grep \'psmdb\' | awk -F " " \'{print $3}\'');
  connection.port = await I.verifyCommand(`docker exec ${connection.container_name} pmm-admin list | grep mongodb_rs1_1 | awk -F " " '{print $3}' | awk -F ":" '{print $2}'`);
  await I.verifyCommand(`docker cp ./testdata/mongodb/testCollections.js  ${connection.container_name}:/`);
  await I.verifyCommand('docker cp ./testdata/mongodb/testCollections.js  pmm-agent_mongo:/');
  await I.verifyCommand(`docker exec ${connection.container_name} /nodes/cl_primary.sh testCollections.js`);
  await I.verifyCommand(`docker exec pmm-agent_mongo mongo --username=${remoteInstancesHelper.remote_instance.mongodb.psmdb_4_2.username} --password='${remoteInstancesHelper.remote_instance.mongodb.psmdb_4_2.password}' < /testCollections.js`);
  await I.verifyCommand(`pmm-admin add mongodb --service-name=${mongodbDockerComposeServiceName} --enable-all-collectors`);
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
    I, adminPage, dashboardPage,
  }) => {
    I.amOnPage(I.buildUrlWithParams(dashboardPage.mongoDbCollectionDetails.clearUrl, { from: 'now-5m', service_name: mongodb_service_name_ac }));
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
  'PMM-T1333 - Verify MongoDB - MongoDB Collections Overview @dashboards @mongodb-exporter',
  async ({
    I, adminPage, dashboardPage,
  }) => {
    I.amOnPage(I.buildUrlWithParams(dashboardPage.mongoDbCollectionsOverview.clearUrl, { from: 'now-5m', service_name: mongodb_service_name_ac }));
    dashboardPage.waitForDashboardOpened();
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
    I, adminPage, dashboardPage,
  }) => {
    I.amOnPage(I.buildUrlWithParams(dashboardPage.mongoDbOplogDetails.clearUrl, { from: 'now-5m', service_name: mongodb_service_name_ac }));
    dashboardPage.waitForDashboardOpened();
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(3);
    adminPage.performPageUp(3);
    dashboardPage.verifyMetricsExistence(dashboardPage.mongoDbOplogDetails.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
  },
);

Scenario(
  'PMM-T1860 - Verify there is no CommandNotSupportOnView error in mongo logs when using --enable-all-collectors @dashboards @mongodb-exporter',
  async ({
    I, dashboardPage, remoteInstancesHelper,
  }) => {
    I.amOnPage(I.buildUrlWithParams(dashboardPage.mongoDbOplogDetails.clearUrl, { from: 'now-5m', service_name: mongodbDockerComposeServiceName }));
    dashboardPage.waitForDashboardOpened();

    const logs = await I.verifyCommand('docker logs pmm-agent_mongo | grep "CommandNotSupportOnView" || true');

    assert.ok(logs.length === 0, `"CommandNotSupportOnView" error should not be in mongo logs. 
 ${logs}`);
  },
);
