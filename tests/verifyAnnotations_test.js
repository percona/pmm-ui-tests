const { pmmInventoryPage, dashboardPage } = inject();
const assert = require('assert');

const annotation = new DataTable(['annotationName', 'service', 'dashboard']);

annotation.add(['annotation-for-mongo', pmmInventoryPage.fields.mongoServiceName, dashboardPage.mongoDbInstanceSummaryDashboard.url]);
annotation.add(['annotation-for-postgres', pmmInventoryPage.fields.pdphsqlServiceName, dashboardPage.postgresqlInstanceSummaryDashboard.url]);
annotation.add(['annotation-for-mysql', pmmInventoryPage.fields.mysqlServiceName, dashboardPage.mysqlInstanceSummaryDashboard.url]);

Feature('Test annotation on dashboards');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T878 - Verify adding annotation for service name: pmm-server-postgresql and node name: pmm-server @nightly @dashboards',
  async ({ I, dashboardPage, annotationAPI }) => {
    const postgresAnnotation = 'annotation-for-postgres';

    await annotationAPI.setAnnotation(postgresAnnotation, 'PMM-T878', 'pmm-server', 'pmm-server-postgresql');
    I.amOnPage(`${dashboardPage.postgresqlInstanceSummaryDashboard.url}`);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.applyFilter('Service Name', 'pmm-server-postgres');
    dashboardPage.verifyAnnotationsLoaded(postgresAnnotation, 3);
    I.seeElement(dashboardPage.annotationText(postgresAnnotation), 10);
  },
);

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

    await annotationAPI.setAnnotation(annotationName, 'PMM-T878', nodeName, serviceName);
    I.amOnPage(current.dashboard);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.applyFilter('Service Name', serviceName);
    if (annotationName === 'annotation-for-postgres') {
      dashboardPage.verifyAnnotationsLoaded(annotationName, 3);
    } else {
      dashboardPage.verifyAnnotationsLoaded(annotationName, 1);
    }

    I.seeElement(dashboardPage.annotationText(annotationName), 10);
  },
);

Data(annotation).Scenario(
  'PMM-T878 - Verify not adding annotation with wrong node name @nightly @dashboards',
  async ({
    I, annotationAPI, current, pmmInventoryPage,
  }) => {
    I.amOnPage(pmmInventoryPage.url);
    I.waitForVisible(current.service, 10);
    const serviceName = await I.grabTextFrom(current.service);

    const errorNumber = await annotationAPI.setAnnotation(`annotation-not-added${serviceName}node-name`, 'PMM-T878', 'random1', serviceName);

    assert.ok(errorNumber === 404, `Annotation for ${serviceName} should not be added with wrong node name`);
  },
);

Scenario(
  'PMM-T878 - Verify not adding annotation with wrong service name @nightly @dashboards',
  async ({
    I, annotationAPI, pmmInventoryPage, inventoryAPI,
  }) => {
    I.amOnPage(pmmInventoryPage.url);
    I.waitForVisible(pmmInventoryPage.fields.mongoServiceName, 10);
    const serviceName = await I.grabTextFrom(pmmInventoryPage.fields.mongoServiceName);
    const nodeID = await pmmInventoryPage.getNodeId(serviceName);
    const nodeName = await inventoryAPI.getNodeName(nodeID);

    const errorNumber = await annotationAPI.setAnnotation('wrong-service-name', 'PMM-T878', nodeName, 'random2');

    assert.ok(errorNumber === 404, `Annotation for ${nodeName} should not be added with wrong node name`);
  },
);

Scenario(
  'PMM-T878 - Verify not adding annotation with empty service name @nightly @dashboards',
  async ({
    I, annotationAPI, pmmInventoryPage, inventoryAPI,
  }) => {
    I.amOnPage(pmmInventoryPage.url);
    I.waitForVisible(pmmInventoryPage.fields.mongoServiceName, 10);
    const serviceName = await I.grabTextFrom(pmmInventoryPage.fields.mongoServiceName);
    const nodeID = await pmmInventoryPage.getNodeId(serviceName);
    const nodeName = await inventoryAPI.getNodeName(nodeID);

    const errorNumber = await annotationAPI.setAnnotation('empty-service-name', 'PMM-T878', nodeName, '');

    assert.ok(errorNumber === 400, `Annotation for ${nodeName} should not be added without service name`);
  },
);

Data(annotation).Scenario(
  'PMM-T877 - Verify adding annotation for specific node @nightly @dashboards',
  async ({
    I, dashboardPage, pmmInventoryPage, annotationAPI, inventoryAPI, current,
  }) => {
    const annotationNameForNode = `${current.annotationName}-node`;

    I.amOnPage(pmmInventoryPage.url);
    I.waitForVisible(current.service, 10);
    const serviceName = await I.grabTextFrom(current.service);
    const nodeID = await pmmInventoryPage.getNodeId(serviceName);
    const nodeName = await inventoryAPI.getNodeName(nodeID);

    await annotationAPI.setAnnotationWithoutServiceName(annotationNameForNode, 'PMM-T877', nodeName);
    I.amOnPage(dashboardPage.nodesCompareDashboard.url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.applyFilter('Node Name', nodeName);
    if (annotationNameForNode === 'annotation-for-postgres-node') {
      dashboardPage.verifyAnnotationsLoaded(annotationNameForNode, 2);
    } else {
      dashboardPage.verifyAnnotationsLoaded(annotationNameForNode, 1);
    }

    I.seeElement(dashboardPage.annotationText(annotationNameForNode), 10);
  },
);
