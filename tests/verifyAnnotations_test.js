const { pmmInventoryPage, dashboardPage } = inject();
const assert = require('assert');

const annotation = new DataTable(['annotationName', 'service', 'dashboard', 'service_type']);

annotation.add(['annotation-for-postgres-server', 'pmm-server', dashboardPage.postgresqlInstanceSummaryDashboard.url, 'POSTGRESQL_SERVICE']);
annotation.add(['annotation-for-mongo', 'mongodb', dashboardPage.mongoDbInstanceSummaryDashboard.url, 'MONGODB_SERVICE']);
annotation.add(['annotation-for-postgres', 'PGSQL', dashboardPage.postgresqlInstanceSummaryDashboard.url, 'POSTGRESQL_SERVICE']);
annotation.add(['annotation-for-mysql', 'ms-', dashboardPage.mysqlInstanceSummaryDashboard.url, 'MYSQL_SERVICE']);
annotation.add(['mysql-node-name', 'ms-', dashboardPage.nodesCompareDashboard.url, 'MYSQL_SERVICE']);

Feature('Test annotation on dashboards');

Before(async ({ I }) => {
  await I.Authorize();
});

Data(annotation).Scenario(
  'PMM-T878 - Verify adding annotation specific dashboard @nightly @dashboards',
  async ({
    I, dashboardPage, pmmInventoryPage, annotationAPI, inventoryAPI, current,
  }) => {
    const { annotationName } = current;

    I.amOnPage(pmmInventoryPage.url);
    I.waitForVisible(pmmInventoryPage.fields.nodesLink, 30);
    const service_response = await inventoryAPI.apiGetNodeInfoForAllNodesByServiceName(current.service_type, current.service);
    const serviceName = service_response[0].service_name;
    const nodeID = await pmmInventoryPage.getNodeId(serviceName);
    const nodeName = await inventoryAPI.getNodeName(nodeID);

    await annotationAPI.setAnnotation(annotationName, 'PMM-T878', nodeName, serviceName, 200);

    I.amOnPage(current.dashboard);
    dashboardPage.waitForDashboardOpened();
    if (annotationName === 'mysql-node-name') {
      await dashboardPage.applyFilter('Node Name', nodeName);
    } else {
      await dashboardPage.applyFilter('Service Name', serviceName);
    }

    if (annotationName === 'annotation-for-postgres') {
      dashboardPage.verifyAnnotationsLoaded(annotationName, 3);
    } else if (annotationName === 'mysql-node-name') {
      dashboardPage.verifyAnnotationsLoaded(annotationName, 2);
    } else {
      dashboardPage.verifyAnnotationsLoaded(annotationName, 1);
    }

    I.seeElement(dashboardPage.annotationText(annotationName), 10);
  },
);

Scenario(
  'PMM-T878 - Verify user is not able to add an annotation for non-existing node name or service name and without service name @nightly @dashboards',
  async ({
    I, annotationAPI, pmmInventoryPage, inventoryAPI,
  }) => {
    I.amOnPage(pmmInventoryPage.url);
    I.waitForVisible(pmmInventoryPage.fields.mysqlServiceName, 10);
    const serviceName = await I.grabTextFrom(pmmInventoryPage.fields.mysqlServiceName);
    const nodeID = await pmmInventoryPage.getNodeId(serviceName);
    const nodeName = await inventoryAPI.getNodeName(nodeID);

    // wrong node name
    await annotationAPI.setAnnotation(`annotation-not-added${serviceName}node-name`, 'PMM-T878', 'random1', serviceName, 404);

    // wrong service name
    await annotationAPI.setAnnotation('wrong-service-name', 'PMM-T878', nodeName, 'random2', 404);

    // without service name
    await annotationAPI.setAnnotation('empty-service-name', 'PMM-T878', nodeName, '', 400);
  },
);
