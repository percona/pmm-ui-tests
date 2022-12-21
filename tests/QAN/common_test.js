Feature('QAN common').retry(1);

Before(async ({ I, qanPage }) => {
  await I.Authorize();
  I.amOnPage(qanPage.url);
});

AfterSuite(async ({ inventoryAPI }) => {
  if (await inventoryAPI.apiGetNodeInfoByServiceName('POSTGRESQL_SERVICE', pgServiceName)) {
    await inventoryAPI.deleteNodeByName(pgServiceName);
  }

  if (await inventoryAPI.apiGetNodeInfoByServiceName('MYSQL_SERVICE', mysqlServiceName)) {
    await inventoryAPI.deleteNodeByName(mysqlServiceName);
  }
});

const container_name = 'mysql_8.0';
const mysqlServiceName = 'remote_mysql-max-q';
const pgServiceName = 'pg-qan-test';

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
    await qanFilters.applyFilter('ps-dev');
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
    await qanFilters.applyFilter('ps-dev');
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
    I, qanPage, searchDashboardsModal, qanOverview, qanDetails,
  }) => {
    qanPage.waitForOpened();
    I.click(qanPage.fields.breadcrumbs.dashboardName);
    I.wait(3);
    searchDashboardsModal.waitForOpened();
    I.click(searchDashboardsModal.fields.closeButton);
    qanPage.waitForOpened();
    qanOverview.waitForOverviewLoaded();
    qanOverview.selectRow(1);
    await qanDetails.checkDetailsTab();
    I.click(qanPage.fields.topMenu.queryAnalytics);
    I.click(qanPage.fields.breadcrumbs.dashboardName);
    I.wait(3);
    searchDashboardsModal.waitForOpened();
    I.click(searchDashboardsModal.fields.closeButton);
    qanPage.waitForOpened();
    qanOverview.waitForOverviewLoaded();
    qanOverview.selectRow(2);
    await qanDetails.checkDetailsTab();
  },
);

Scenario(
  'PMM-T188 Verify dashboard refresh @qan',
  async ({
    I, qanPage, searchDashboardsModal, qanDetails, qanOverview, dashboardPage, qanFilters, adminPage,
  }) => {
    qanPage.waitForOpened();

    await qanOverview.changeMainMetric('Database');
    qanOverview.changeSorting(2);
    qanFilters.applyFilter('pmm-managed');
    qanOverview.addSpecificColumn('Bytes Sent');
    await adminPage.applyTimeRange('Last 1 hour');
    await qanOverview.searchByValue('pmm-managed');
    qanOverview.selectTotalRow();

    dashboardPage.selectRefreshTimeInterval('5s');
    // Sometimes refresh doesn't happen after 5s for the first time
    await I.waitForElement(qanOverview.elements.spinner, 10);
    await I.waitForDetached(qanOverview.elements.spinner, 5);

    await qanOverview.verifyMainMetric('Database');
    await qanOverview.verifySorting(2, 'asc');
    await qanFilters.verifySelectedFilters('pmm-managed');
    await qanOverview.verifyColumnPresent('Bytes Sent');
    await qanDetails.checkDetailsTab();
    await adminPage.verifyTimeRange('Last 1 hour');
    await qanOverview.verifySearchByValue('pmm-managed');

    dashboardPage.selectRefreshTimeInterval('1m');
    await I.waitForElement(qanOverview.elements.spinner, 60);
    await I.waitForDetached(qanOverview.elements.spinner, 5);
    dashboardPage.selectRefreshTimeInterval('Off');
    await I.verifyInvisible(qanOverview.elements.spinner, 70);
  },
);

Scenario(
  '@PMM-T1402 - Verify adding MySQL instance via UI with specified Max Query Length option'
  + ' @ssl @ssl-remote @not-ui-pipeline',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, inventoryAPI,
  }) => {
    const port = await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep "MySQL" | grep "mysql_client" | awk -F":" '{print $2}' | awk -F" " '{ print $1}' | head -1`);
    const details = {
      serviceName: mysqlServiceName,
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

    // there is no message on success, ut there is on fail and need to report it
    // eslint-disable-next-line no-undef
    if (!await tryTo(() => I.waitInUrl(pmmInventoryPage.servicesUrl, 2))) {
      I.verifyPopUpMessage('success', 1);
    }

    I.waitForVisible(pmmInventoryPage.fields.agentsLink, 30);
    await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
      {
        serviceType: 'MYSQL_SERVICE',
        service: 'mysql',
      },
      details.serviceName,
    );
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(mysqlServiceName);
    const serviceId = await pmmInventoryPage.getServiceId(mysqlServiceName);

    I.waitForVisible(pmmInventoryPage.fields.agentsLink, 30);
    I.click(pmmInventoryPage.fields.agentsLink);
    await pmmInventoryPage.checkAgentOtherDetailsSection('max_query_length:', 'max_query_length: 10', mysqlServiceName, serviceId);
  },
).retry(0);

Scenario(
  '@PMM-T1388 - Verify adding postgresql with --max-query-length=10'
  + ' @ssl @ssl-remote @not-ui-pipeline',
  async ({
    I, pmmInventoryPage, inventoryAPI, qanPage, qanOverview, addInstanceAPI,
    remoteInstancesHelper, credentials, qanFilters,
  }) => {
    const expectedQueryLength = 7;

    if (!await inventoryAPI.apiGetNodeInfoByServiceName('POSTGRESQL_SERVICE', pgServiceName)) {
      await addInstanceAPI.apiAddInstance(remoteInstancesHelper.instanceTypes.postgresql, pgServiceName,
        {
          host: 'localhost',
          username: credentials.postgreSql.pmmServerUser,
          password: credentials.postgreSql.pmmServerUser,
          maxQueryLength: `${expectedQueryLength}`,
        });
    }

    await pmmInventoryPage.open();
    await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
      { serviceType: 'POSTGRESQL_SERVICE', service: 'postgresql' },
      pgServiceName,
    );
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(pgServiceName);
    const serviceId = await pmmInventoryPage.getServiceId(pgServiceName);

    await pmmInventoryPage.openAgents();
    await pmmInventoryPage.checkAgentOtherDetailsSection(
      'max_query_length:', `max_query_length: ${expectedQueryLength}`, pgServiceName, serviceId,
    );

    I.amOnPage(I.buildUrlWithParams(qanPage.clearUrl, { service_name: pgServiceName, cmd_type: 'SELECT' }));
    I.waitForVisible(qanFilters.buttons.showSelected, 30);
    qanOverview.selectRow(2);
    qanFilters.waitForFiltersToLoad();
    const queryFromRow = await qanOverview.getQueryFromRow(1);

    I.assertLengthOf(queryFromRow, expectedQueryLength, `Query "${queryFromRow}" length does not match expected: ${expectedQueryLength}`);
  },
);
