const assert = require('assert');
const { qanFilters } = require('../remoteInstances/remoteInstancesHelper');

Feature('QAN common');

Before(async ({ I, qanPage }) => {
  await I.Authorize();
  I.amOnPage(qanPage.url);
});

Scenario(
  'PMM-T269 - Verify QAN UI Elements are displayed @qan',
  async ({
    I, qanFilters, qanOverview, qanPagination,
  }) => {
    await qanOverview.waitForOverviewLoaded();
    await I.waitForVisible(qanOverview.buttons.addColumn, 30);
    await qanOverview.verifyRowCount(27);
    await qanPagination.verifyPagesAndCount(25);

    for await (const filter of qanFilters.filterGroups) {
      await I.wait(5);
      await I.waitForElement(qanFilters.elements.filterValuesByFilterName(filter), 10);
      const numberOfFilterValues = await I.grabNumberOfVisibleElements(qanFilters.elements.filterValuesByFilterName(filter));
      const randomFilterValue = Math.floor(Math.random() * numberOfFilterValues) + 1;

      await I.click(qanFilters.elements.filterValuesByFilterName(filter).at(randomFilterValue));
      await I.assertTrue((await qanOverview.getRowCount()) > 0, `No values for filter: "${filter}" were displayed`);
      await I.click(qanFilters.elements.filterValuesByFilterName(filter).at(randomFilterValue));
    }

    await qanFilters.selectFilter('pmm-server');
    await I.wait(3);
    const numberOfFilters = await I.grabNumberOfVisibleElements(qanFilters.elements.filterHeaders);

    for (let i = 0; i < numberOfFilters; i++) {
      const filterName = await I.grabTextFrom(qanFilters.elements.filterHeaders.at(i + 1));
      const displayedFilterValue = await I.grabTextFrom(qanFilters.elements.filterValuesByFilterName(filterName));

      I.assertContain(
        displayedFilterValue,
        'pmm-server',
        `Displayed filter value: "${displayedFilterValue}" does not contain expected value: "pmm-server"`,
      );
    }
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

    assert.ok(overviewValue === detailsValue, `Query Count value in Overview and Detail should match. Overview:'${overviewValue}'!=Detail:'${detailsValue}'`);

    overviewValue = await I.grabTextFrom(qanOverview.getCellValueLocator(1, 3));
    detailsValue = await I.grabTextFrom(qanDetails.getMetricsCellLocator('Query Time', 4));

    assert.ok(overviewValue === detailsValue, `Query Time value in Overview and Detail should match. Overview:'${overviewValue}'!=Detail:'${detailsValue}'`);
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
    await I.waitForElement(qanPage.fields.search);
    await I.click(qanPage.fields.search);
    await searchDashboardsModal.waitForOpened();
    await I.pressKey('Escape');
    await qanPage.waitForOpened();
    await qanOverview.waitForOverviewLoaded();
    await qanOverview.selectRow(1);
    await qanDetails.checkDetailsTab();

    await I.click(qanPage.fields.topMenu.queryAnalytics);
    await I.click(qanPage.fields.search);
    await searchDashboardsModal.waitForOpened();
    await I.pressKey('Escape');
    await qanPage.waitForOpened();
    await qanOverview.waitForOverviewLoaded();
    await qanOverview.selectRow(2);
    await qanDetails.checkDetailsTab();
  },
);

Scenario(
  'PMM-T188 Verify dashboard refresh @qan',
  async ({
    I, qanPage, qanDetails, qanOverview, dashboardPage, adminPage, queryAnalyticsPage,
  }) => {
    await qanPage.waitForOpened();
    await qanOverview.changeMainMetric('Database');
    await qanOverview.changeSorting(2);
    await queryAnalyticsPage.filters.selectFilterInGroup('pmm-managed', 'Database');
    await qanOverview.addSpecificColumn('Bytes Sent');
    await adminPage.applyTimeRange('Last 1 hour');
    await qanOverview.searchByValue('pmm-managed');
    await qanOverview.selectTotalRow();
    await dashboardPage.selectRefreshTimeInterval('5s');
    await qanOverview.verifyMainMetric('Database');
    await qanOverview.verifySorting(2, 'asc');
    await queryAnalyticsPage.filters.verifySelectedFilters('pmm-managed');
    await qanOverview.verifyColumnPresent('Bytes Sent');
    await qanDetails.checkDetailsTab();
    await adminPage.verifyTimeRange('Last 1 hour');
    await qanOverview.verifySearchByValue('pmm-managed');
    await dashboardPage.selectRefreshTimeInterval('Off');
    await I.verifyInvisible(qanOverview.elements.spinner, 70);
  },
);
