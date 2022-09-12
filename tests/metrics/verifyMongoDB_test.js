Feature('MongoDB Metrics tests');

const connection = {
  host: '127.0.0.1',
  // eslint-disable-next-line no-inline-comments
  port: '27023', // This is the port used by --addclient=modb,1 and docker-compose setup on a CI/CD
  username: 'mongoadmin',
  password: 'secret',
};
const mongodb_service_name = 'mongodb_test_pass_plus';
const mongodb_service_name_ac = 'mongodb_node_all_collectors';
const mongo_test_user = {
  username: 'test_user',
  password: 'pass+',
};

const collectionNames = ['col1', 'col2', 'col3', 'col4', 'col5'];
const dbNames = ['db1', 'db2', 'db3', 'db4'];

BeforeSuite(async ({ I, grafanaAPI }) => {
  connection.port = await I.verifyCommand('pmm-admin list | grep mongodb_node_1 | awk -F " " \'{print $3}\' | awk -F ":" \'{print $2}\'');
  await I.mongoConnect(connection);
  await I.mongoConnectReplica({
    username: 'admin',
    password: 'password',
  });
  await I.mongoAddUser(mongo_test_user.username, mongo_test_user.password);
  for (let i = 0; i < dbNames.length; i++) {
    await I.mongoCreateBulkCollections(dbNames[i], collectionNames);
  }
  
  await I.say(
    await I.verifyCommand(`pmm-admin add mongodb --port=${connection.port} --password=${connection.password} --username='${connection.username}' --replication-set=rs0 --service-name=${mongodb_service_name_ac} --enable-all-collectors`),
  );

  await grafanaAPI.waitForMetric('mongodb_up', { type: 'service_name', value: mongodb_service_name_ac }, 65);
});

Before(async ({ I }) => {
  await I.Authorize();
});

After(async ({ I }) => {
  await I.verifyCommand(`pmm-admin remove mongodb ${mongodb_service_name}`);
  await I.verifyCommand(`pmm-admin remove mongodb ${mongodb_service_name_ac}`);
});

AfterSuite(async ({ I }) => {
  await I.mongoDisconnect();
});

Scenario(
  'PMM-T1241 - Verify add mongoDB service with "+" in user password @not-ui-pipeline @mongodb-exporter @exporters @nazarov',
  async ({ I, grafanaAPI }) => {
    await I.say(
      await I.verifyCommand(`pmm-admin add mongodb --port=${connection.port} --password=${mongo_test_user.password} --username='${mongo_test_user.username}' --service-name=${mongodb_service_name}`),
    );

    await grafanaAPI.waitForMetric('mongodb_up', { type: 'service_name', value: mongodb_service_name }, 65);
  },
);

Scenario(
  'PMM-T1332 - Verify MongoDB - MongoDB Collection Details @mongodb-exporter @exporters',
  async ({
    I, grafanaAPI, adminPage, homePage, dashboardPage, searchDashboardsModal,
  }) => {
    await homePage.open();
    I.click(dashboardPage.fields.breadcrumbs.dashboardName);
    searchDashboardsModal.waitForOpened();
    searchDashboardsModal.expandFolder('Experimental');
    searchDashboardsModal.openDashboard('MongoDB Collection Details');
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.changeServiceName(`${mongodb_service_name}`);
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(2);
    adminPage.performPageUp(2);
    I.seeTextEquals('The next two graphs are available only when --enable-all-collectors option is used in pmm-admin.', locate('$TextPanel-converted-content'));

    dashboardPage.verifyMetricsExistence(dashboardPage.mongoDbCollectionDetails.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(0);
  },
);

Scenario(
  'PMM-T1333 - Verify MongoDB - MongoDB Collections Overview @mongodb-exporter @exporters @nazarov',
  async ({
    I, grafanaAPI, adminPage, homePage, dashboardPage, searchDashboardsModal,
  }) => {
    await homePage.open();
    I.click(dashboardPage.fields.breadcrumbs.dashboardName);
    searchDashboardsModal.waitForOpened();
    searchDashboardsModal.expandFolder('Experimental');
    searchDashboardsModal.openDashboard('MongoDB Collections Overview');
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.changeServiceName(`${mongodb_service_name}`);

    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(3);
    adminPage.performPageUp(3);
    dashboardPage.verifyMetricsExistence(dashboardPage.mongoDbCollectionsOverview.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(0);
  },
);

Scenario(
  'PMM-T1334 - Verify MongoDB - MongoDB Oplog Details @mongodb-exporter @exporters @nazarov',
  async ({
    I, adminPage, homePage, dashboardPage, searchDashboardsModal,
  }) => {
    await homePage.open();
    I.click(dashboardPage.fields.breadcrumbs.dashboardName);
    searchDashboardsModal.waitForOpened();
    searchDashboardsModal.expandFolder('Experimental');
    searchDashboardsModal.openDashboard('MongoDB Oplog Details');
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.changeServiceName(`${mongodb_service_name}`);

    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(3);
    adminPage.performPageUp(3);
    dashboardPage.verifyMetricsExistence(dashboardPage.mongoDbOplogDetails.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(0);
  },
);
