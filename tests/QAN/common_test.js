Feature('QAN common').retry(1);

Before(async ({ I, qanPage }) => {
  await I.Authorize();
  I.amOnPage(qanPage.url);
});

const version = process.env.PS_VERSION ? `${process.env.PS_VERSION}` : '8.0';
const container_name = `ps_pmm_${version}`;
const remoteServiceName = 'remote_pmm-mysql-integration';

const connection = {
  host: container_name,
  username: 'msandbox',
  password: 'msandbox',
};

Scenario(
  'PMM-T122 PMM-T269 - Verify QAN UI Elements are displayed @qan',
  async ({
    I, qanFilters, qanOverview, qanPagination,
  }) => {
    qanOverview.waitForOverviewLoaded();
    I.waitForVisible(qanOverview.buttons.addColumn, 30);
    await qanPagination.verifyPagesAndCount(25);
    I.waitForVisible(qanFilters.elements.environmentLabel, 30);
    await qanOverview.verifyRowCount(27);
    qanFilters.applyFilter('ps-dev');
    I.waitForVisible(qanFilters.fields.filterBy, 30);
    await qanOverview.searchByValue('insert');
    I.waitForVisible(qanOverview.elements.querySelector, 30);
    // TODO: find test case in TM4J
    // I.click(qanOverview.elements.querySelector);
    // I.waitForVisible(qanOverview.getColumnLocator('Lock Time'), 30);
  },
);

Scenario(
  'PMM-T186 - Verify values in overview and in details match @qan',
  async ({
    I, qanOverview, qanFilters, qanDetails, adminPage,
  }) => {
    const cellValue = qanDetails.getMetricsCellLocator('Query Time', 3);

    qanOverview.waitForOverviewLoaded();
    await adminPage.applyTimeRange('Last 1 hour');
    qanOverview.waitForOverviewLoaded();
    qanFilters.applyFilter('ps-dev');
    await qanOverview.searchByValue('insert');
    I.waitForElement(qanOverview.elements.querySelector, 30);
    qanOverview.selectRow(1);
    I.waitForVisible(cellValue, 30);
    let overviewValue = await I.grabTextFrom(qanOverview.getCellValueLocator(1, 2));
    let detailsValue = await I.grabTextFrom(qanDetails.getMetricsCellLocator('Query Count', 2));

    I.assertEqual(overviewValue, detailsValue, `Query Count value in Overview and Detail should match. Overview:'${overviewValue}'!=Detail:'${detailsValue}'`);

    overviewValue = await I.grabTextFrom(qanOverview.getCellValueLocator(1, 3));
    detailsValue = await I.grabTextFrom(qanDetails.getMetricsCellLocator('Query Time', 4));

    I.assertEqual(overviewValue, detailsValue, `Query Time value in Overview and Detail should match. Overview:'${overviewValue}'!=Detail:'${detailsValue}'`);
  },
);

Scenario(
  'PMM-T215 - Verify that buttons in QAN are disabled and visible on the screen @qan',
  async ({
    I, qanPagination, qanFilters, qanOverview,
  }) => {
    qanFilters.waitForFiltersToLoad();
    qanOverview.waitForOverviewLoaded();
    I.seeAttributesOnElements(qanPagination.buttons.previousPage, { 'aria-disabled': 'true' });
    I.seeAttributesOnElements(qanPagination.buttons.nextPage, { 'aria-disabled': 'false' });
    I.seeElementsDisabled(qanFilters.buttons.resetAll);
    I.seeElementsDisabled(qanFilters.buttons.showSelected);
    const count = await qanOverview.getCountOfItems();

    if (count > 100) {
      I.seeElement(qanPagination.buttons.ellipsis);
    }
  },
);

Scenario(
  'PMM-T1207 - Verify dashboard search between QAN and dashboards @qan',
  async ({
    I, qanPage, searchDashboardsModal, qanOverview,
  }) => {
    qanPage.waitForOpened();
    I.click(qanPage.fields.breadcrumbs.dashboardName);
    I.wait(3);
    searchDashboardsModal.waitForOpened();
    I.click(searchDashboardsModal.fields.closeButton);
    qanPage.waitForOpened();
    qanOverview.waitForOverviewLoaded();
    qanOverview.selectRow(1);
    I.click(qanPage.fields.topMenu.queryAnalytics);
    I.click(qanPage.fields.breadcrumbs.dashboardName);
    I.wait(3);
    searchDashboardsModal.waitForOpened();
    I.click(searchDashboardsModal.fields.closeButton);
    qanPage.waitForOpened();
  },
);

Scenario(
  '@PMM-T1402 - Verify adding MySQL instance via UI with specified Max Query Length option @qan @not-ui-pipeline',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, inventoryAPI,
  }) => {
    const port = await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep "MySQL" | grep "mysql_client" | awk -F":" '{print $2}' | awk -F" " '{ print $1}' | head -1`);
    const details = {
      serviceName: remoteServiceName,
      serviceType: 'MYSQL_SERVICE',
      port,
      username: connection.username,
      password: connection.password,
      host: container_name,
      cluster: 'ps_remote_cluster',
      environment: 'ps_remote_cluster',
      maxQueryLength: '10',
    };

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage('mysql');
    remoteInstancesPage.fillRemoteMySqlForm(details);

    I.click(remoteInstancesPage.fields.addService);
    I.waitForVisible(pmmInventoryPage.fields.agentsLink, 30);
    await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
      {
        serviceType: 'MYSQL_SERVICE',
        service: 'mysql',
      },
      details.serviceName,
    );
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(remoteServiceName);
    const serviceId = await pmmInventoryPage.getServiceId(remoteServiceName);

    I.waitForVisible(pmmInventoryPage.fields.agentsLink, 30);
    I.click(pmmInventoryPage.fields.agentsLink);
    await pmmInventoryPage.checkAgentOtherDetailsSection('max_query_length:', 'max_query_length: 10', remoteServiceName, serviceId);
  },
);
