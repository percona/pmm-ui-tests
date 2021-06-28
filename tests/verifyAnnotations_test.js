const { pmmInventoryPage, dashboardPage } = inject();

const annotation = new DataTable(['annotationName', 'service', 'dashboard']);

annotation.add(['annotation-for-mongo', pmmInventoryPage.fields.mongoServiceName, dashboardPage.mongoDbInstanceSummaryDashboard.url]);
annotation.add(['annotation-for-postgres', pmmInventoryPage.fields.pdphsqlServiceName, dashboardPage.postgresqlInstanceSummaryDashboard.url]);
annotation.add(['annotation-for-mysql', pmmInventoryPage.fields.mysqlServiceName, dashboardPage.mysqlInstanceSummaryDashboard.url]);

Feature('Test annotation on dashboards');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T877 - Verify adding annotation for service name: pmm-server-postgresql and node name: pmm-server @nightly @dashboards',
  async ({ I, dashboardPage, grafanaAPI }) => {
    const postgresAnnotation = 'annotation-for-postgres';

    await grafanaAPI.setAnnotation(postgresAnnotation, 'PMM-T877', 'pmm-server', 'pmm-server-postgresql');
    I.amOnPage(`${dashboardPage.postgresqlInstanceSummaryDashboard.url}`);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.applyFilter('Service Name', 'pmm-server-postgres');
    dashboardPage.verifyAnnotationsLoaded(postgresAnnotation, 3);
    I.seeElement(dashboardPage.annotationText(postgresAnnotation), 10);
  },
);

Data(annotation).Scenario(
  'PMM-T877 - Verify adding annotation specific dashboard @nightly @dashboards',
  async ({
    I, dashboardPage, pmmInventoryPage, grafanaAPI, inventoryAPI, current,
  }) => {
    const { annotationName } = current;

    I.amOnPage(pmmInventoryPage.url);
    const serviceName = await I.grabTextFrom(current.service);
    const nodeID = await pmmInventoryPage.getNodeId(serviceName);
    const nodeName = await inventoryAPI.getNodeName(nodeID);

    await grafanaAPI.setAnnotation(annotationName, 'PMM-T877', nodeName, serviceName);
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
