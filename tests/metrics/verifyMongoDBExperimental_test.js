Feature('MongoDB Metrics tests');

const connection = {
  // eslint-disable-next-line no-inline-comments
  port: '27017', // This is the port used by ---addclient=mo,1 --with-replica --mongomagic
  container_name: 'psmdb_pmm',
};
const mongodb_service_name_ac = 'mongodb_service_all_collectors';

BeforeSuite(async ({ I, grafanaAPI }) => {
  connection.container_name = await I.verifyCommand('docker ps --format "table {{.ID}}\\t{{.Image}}\\t{{.Names}}" | grep \'psmdb\' | awk -F " " \'{print $3}\'');
  connection.host = connection.container_name;
  connection.port = await I.verifyCommand(`docker exec ${connection.container_name} pmm-admin list | grep mongodb_rs1_1 | awk -F " " '{print $3}' | awk -F ":" '{print $2}'`);
  await I.verifyCommand(`docker exec ${connection.container_name} pmm-admin add mongodb --cluster mongodb_node_cluster --replication-set=rs1 --environment=mongodb_rs_node --port=${connection.port} --service-name=${mongodb_service_name_ac} --enable-all-collectors --max-collections-limit=2000`);
  await grafanaAPI.waitForMetric('mongodb_up', { type: 'service_name', value: mongodb_service_name_ac }, 65);
});

Before(async ({ I }) => {
  await I.Authorize();
});

AfterSuite(async ({ I }) => {
  const removeMongodbIfExists = async function (serviceName) {
    if (await I.verifyCommand(`pmm-admin list | { grep ${serviceName} || true; }`) !== '') {
      await I.verifyCommand(`pmm-admin remove mongodb ${serviceName}`);
    }
  };

  await removeMongodbIfExists(mongodb_service_name_ac);
});

Scenario(
  'PMM-T1332 - Verify MongoDB - MongoDB Collection Details @dashboards @nazarov',
  async ({
    I, grafanaAPI, adminPage, homePage, dashboardPage, searchDashboardsModal,
  }) => {
    await homePage.open();
    I.click(dashboardPage.fields.breadcrumbs.dashboardName);
    searchDashboardsModal.waitForOpened();
    searchDashboardsModal.expandFolder('Experimental');
    searchDashboardsModal.openDashboard('MongoDB Collection Details');
    dashboardPage.waitForDashboardOpened();
    dashboardPage.setTimeRange();
    await dashboardPage.changeServiceName(`${mongodb_service_name_ac}`);
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(2);
    adminPage.performPageUp(2);
    I.seeTextEquals('The next two graphs are available only when --enable-all-collectors option is used in pmm-admin.', locate('$TextPanel-converted-content').as('Explanation text field'));
    dashboardPage.verifyMetricsExistence(dashboardPage.mongoDbCollectionDetails.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(0);
  },
);

Scenario(
  'PMM-T1333 - Verify MongoDB - MongoDB Collections Overview @dashboards @nazarov',
  async ({
    I, grafanaAPI, adminPage, homePage, dashboardPage, searchDashboardsModal,
  }) => {
    await homePage.open();
    I.click(dashboardPage.fields.breadcrumbs.dashboardName);
    searchDashboardsModal.waitForOpened();
    searchDashboardsModal.expandFolder('Experimental');
    searchDashboardsModal.openDashboard('MongoDB Collections Overview');
    dashboardPage.waitForDashboardOpened();
    dashboardPage.setTimeRange();
    await dashboardPage.changeServiceName(`${mongodb_service_name_ac}`);
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(3);
    adminPage.performPageUp(3);
    dashboardPage.verifyMetricsExistence(dashboardPage.mongoDbCollectionsOverview.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(0);
  },
);

Scenario(
  'PMM-T1334 - Verify MongoDB - MongoDB Oplog Details @dashboards @nazarov',
  async ({
    I, adminPage, homePage, dashboardPage, searchDashboardsModal,
  }) => {
    await homePage.open();
    I.click(dashboardPage.fields.breadcrumbs.dashboardName);
    searchDashboardsModal.waitForOpened();
    searchDashboardsModal.expandFolder('Experimental');
    searchDashboardsModal.openDashboard('MongoDB Oplog Details');
    dashboardPage.waitForDashboardOpened();
    dashboardPage.setTimeRange();
    await dashboardPage.changeServiceName(`${mongodb_service_name_ac}`);
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(3);
    adminPage.performPageUp(3);
    dashboardPage.verifyMetricsExistence(dashboardPage.mongoDbOplogDetails.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(0);
  },
);
