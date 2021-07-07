const { pmmInventoryPage, dashboardPage } = inject();
const assert = require('assert');

const annotation = new DataTable(['annotationName', 'service', 'dashboard']);

annotation.add(['annotation-for-postgres-server', pmmInventoryPage.fields.pmmServerPostgresLocator, dashboardPage.postgresqlInstanceSummaryDashboard.url]);
annotation.add(['annotation-for-mongo', pmmInventoryPage.fields.mongoServiceName, dashboardPage.mongoDbInstanceSummaryDashboard.url]);
annotation.add(['annotation-for-postgres', pmmInventoryPage.fields.pdphsqlServiceName, dashboardPage.postgresqlInstanceSummaryDashboard.url]);
annotation.add(['annotation-for-mysql', pmmInventoryPage.fields.mysqlServiceName, dashboardPage.mysqlInstanceSummaryDashboard.url]);
annotation.add(['mysql-node-name', pmmInventoryPage.fields.mysqlServiceName, dashboardPage.nodesCompareDashboard.url]);

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
    I.waitForVisible(current.service, 10);
    const serviceName = await I.grabTextFrom(current.service);
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
    }
    else if(annotationName === 'mysql-node-name') {
      dashboardPage.verifyAnnotationsLoaded(annotationName, 2);
    }
    else {
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
