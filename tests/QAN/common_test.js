Feature('QAN common').retry(1);

Before(async ({ I, qanPage }) => {
  await I.Authorize();
  I.amOnPage(qanPage.url);
});

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
    I, qanPage, qanDetails, qanOverview, dashboardPage, qanFilters, adminPage,
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
