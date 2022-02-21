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
      dashboardPage.expandFilters('Interval');
    } else {
      await dashboardPage.applyFilter('Service Name', serviceName);
    }

    dashboardPage.verifyAnnotationsLoaded(annotationName);
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

Scenario(
  'PMM-T165: Verify Annotation with Default Options @instances',
  async ({ I, dashboardPage }) => {
    const annotationTitle = 'pmm-annotate-without-tags';

    await I.verifyCommand(
      `pmm-admin annotate "${annotationTitle}"`,
    );

    I.amOnPage(`${dashboardPage.processDetailsDashboard.url}`);
    dashboardPage.waitForDashboardOpened();
    dashboardPage.verifyAnnotationsLoaded('pmm-annotate-without-tags', 1);
    I.seeElement(dashboardPage.annotationText(annotationTitle));
  },
);

Scenario(
  'PMM-T166: Verify adding annotation with specified tags @instances',
  async ({ I, dashboardPage }) => {
    const annotationTitle2 = 'pmm-annotate-tags';
    const annotationTag1 = 'pmm-testing-tag1';
    const annotationTag2 = 'pmm-testing-tag2';
    const defaultAnnotation = 'pmm_annotation';

    await I.verifyCommand(
      `pmm-admin annotate "${annotationTitle2}" --tags="${annotationTag1},${annotationTag2}"`,
    );
    I.amOnPage(`${dashboardPage.processDetailsDashboard.url}`);
    dashboardPage.waitForDashboardOpened();
    dashboardPage.verifyAnnotationsLoaded('pmm-annotate-tags', 2);
    I.seeElement(dashboardPage.annotationText(annotationTitle2));
    I.seeElement(dashboardPage.annotationTagText(annotationTag1));
    I.seeElement(dashboardPage.annotationTagText(annotationTag2));
    I.seeElement(dashboardPage.annotationTagText(defaultAnnotation));
  },
);
