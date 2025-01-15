const { pmmInventoryPage, dashboardPage } = inject();
const assert = require('assert');
const { SERVICE_TYPE } = require('./helper/constants');

const annotation = new DataTable(['annotationName', 'service', 'dashboard', 'service_type']);

annotation.add(['annotation-for-postgres-server', 'pmm-server', dashboardPage.postgresqlInstanceSummaryDashboard.url, SERVICE_TYPE.POSTGRESQL]);
annotation.add(['annotation-for-mongo', 'rs101', dashboardPage.mongoDbInstanceSummaryDashboard.url, SERVICE_TYPE.MONGODB]);
annotation.add(['annotation-for-postgres', 'PGSQL_17', dashboardPage.postgresqlInstanceSummaryDashboard.url, SERVICE_TYPE.POSTGRESQL]);
annotation.add(['annotation-for-mysql', 'ps_', dashboardPage.mysqlInstanceSummaryDashboard.url, SERVICE_TYPE.MYSQL]);
annotation.add(['mysql-node-name', 'ps_', dashboardPage.nodesCompareDashboard.url, SERVICE_TYPE.MYSQL]);

Feature('Test annotation on dashboards');

Before(async ({ I }) => {
  await I.Authorize();
});

Data(annotation).Scenario(
  'PMM-T878 - Verify adding annotation specific dashboard @nightly @dashboards @annotations',
  async ({
    I, dashboardPage, pmmInventoryPage, annotationAPI, inventoryAPI, current,
  }) => {
    const { annotationName } = current;
    let service_response;

    I.amOnPage(pmmInventoryPage.url);

    if (current.service !== 'pmm-server') {
      service_response = await inventoryAPI.apiGetNodeInfoByServiceName(current.service_type, current.service, 'pmm-server');
    } else {
      service_response = await inventoryAPI.apiGetNodeInfoByServiceName(current.service_type, current.service);
    }

    const serviceName = service_response.service_name;
    const nodeID = service_response.node_id;
    const nodeName = await inventoryAPI.getNodeName(nodeID);

    await annotationAPI.setAnnotation(annotationName, 'PMM-T878', nodeName, serviceName, 200);

    I.amOnPage(current.dashboard);
    dashboardPage.waitForDashboardOpened();
    if (annotationName === 'mysql-node-name') {
      await dashboardPage.applyFilter('Node Name', nodeName);
      dashboardPage.expandFilters('Interval');
      dashboardPage.verifyAnnotationsLoaded(annotationName, 2);
    } else {
      await dashboardPage.applyFilter('Service Name', serviceName);
      dashboardPage.verifyAnnotationsLoaded(annotationName, 1);
    }
  },
).retry(1);

Scenario(
  'PMM-T878 - Verify user is not able to add an annotation for non-existing node name or service name and without service name @nightly @dashboards',
  async ({
    I, annotationAPI, pmmInventoryPage, inventoryAPI,
  }) => {
    I.amOnPage(pmmInventoryPage.url);

    const service_response = await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.MYSQL, 'ps_');
    const serviceName = service_response.service_name;

    // wrong node name
    await annotationAPI.setAnnotation('wrong-node-name', 'PMM-T878', 'random1', serviceName, 404);

    // wrong service name
    await annotationAPI.setAnnotation('wrong-service-name', 'PMM-T878', 'pmm-server', 'random2', 404);

    // without service name
    await annotationAPI.setAnnotation('empty-service-name', 'PMM-T878', 'pmm-server', '', 400);
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
