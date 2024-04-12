const assert = require('assert');

Feature('QAN common').retry(1);

Before(async ({ I, qanPage }) => {
  await I.Authorize();
  I.amOnPage(qanPage.url);
});

Scenario(
  'PMM-T269 - Verify QAN UI Elements are displayed @qan',
  async ({
    I, queryAnalyticsPage,
  }) => {
    queryAnalyticsPage.waitForLoaded();
    I.waitForVisible(queryAnalyticsPage.buttons.addColumn, 30);
    await queryAnalyticsPage.data.verifyRowCount(26);
    await queryAnalyticsPage.data.verifyPagesAndCount(25);

    for await (const filter of queryAnalyticsPage.filters.labels.filterGroups) {
      I.wait(5);
      I.waitForElement(queryAnalyticsPage.filters.fields.filterCheckBoxesInGroup(filter), 10);
      const numberOfFilterValues = await I.grabNumberOfVisibleElements(queryAnalyticsPage.filters.fields.filterCheckBoxesInGroup(filter));
      const randomFilterValue = Math.floor(Math.random() * numberOfFilterValues) + 1;

      await queryAnalyticsPage.filters.selectFilterInGroupAtPosition(filter, randomFilterValue);
      I.assertTrue((await queryAnalyticsPage.data.getRowCount()) > 0, `No values for filter: "${filter}" were displayed`);
      await queryAnalyticsPage.filters.selectFilterInGroupAtPosition(filter, randomFilterValue);
    }

    queryAnalyticsPage.filters.filterBy('pmm-server');
    I.wait(3);
    const numberOfFilters = await I.grabNumberOfVisibleElements(queryAnalyticsPage.filters.fields.filterHeaders);

    for (let i = 1; i <= numberOfFilters; i++) {
      const filterName = await I.grabTextFrom(queryAnalyticsPage.filters.fields.filterHeaders.at(i));
      const displayedFilterValue = await I.grabTextFrom(queryAnalyticsPage.filters.fields.filterCheckBoxesInGroup(filterName));

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
    I, adminPage, queryAnalyticsPage,
  }) => {
    queryAnalyticsPage.waitForLoaded();
    await adminPage.applyTimeRange('Last 1 hour');
    queryAnalyticsPage.waitForLoaded();
    queryAnalyticsPage.filters.selectFilter('ps-dev');
    queryAnalyticsPage.data.searchByValue('insert');
    I.waitForElement(queryAnalyticsPage.data.elements.queryRow(1), 30);
    queryAnalyticsPage.data.selectRow(1);
    I.waitForVisible(queryAnalyticsPage.data.elements.metricsCellDetailValue('Query Time', 3), 30);
    let overviewValue = await I.grabTextFrom(queryAnalyticsPage.data.elements.queryValue(1, 2));
    let detailsValue = await I.grabTextFrom(queryAnalyticsPage.data.elements.metricsCellDetailValue('Query Count', 2), 30);

    assert.ok(overviewValue === detailsValue, `Query Count value in Overview and Detail should match. Overview:'${overviewValue}'!=Detail:'${detailsValue}'`);

    overviewValue = await I.grabTextFrom(queryAnalyticsPage.data.elements.queryValue(1, 3));
    detailsValue = await I.grabTextFrom(queryAnalyticsPage.data.elements.metricsCellDetailValue('Query Time', 4), 30);

    assert.ok(overviewValue === detailsValue, `Query Time value in Overview and Detail should match. Overview:'${overviewValue}'!=Detail:'${detailsValue}'`);
  },
);

Scenario(
  'PMM-T215 - Verify that buttons in QAN are disabled and visible on the screen @qan',
  async ({
    I, queryAnalyticsPage,
  }) => {
    queryAnalyticsPage.waitForLoaded();
    I.seeAttributesOnElements(queryAnalyticsPage.data.buttons.previousPage, { 'aria-disabled': 'true' });
    I.seeAttributesOnElements(queryAnalyticsPage.data.buttons.nextPage, { 'aria-disabled': 'false' });
    I.seeElementsDisabled(queryAnalyticsPage.filters.buttons.resetAll);
    I.seeElementsDisabled(queryAnalyticsPage.filters.buttons.showSelected);
    const count = await queryAnalyticsPage.data.getCountOfItems();

    if (count > 100) {
      I.seeElement(queryAnalyticsPage.data.buttons.ellipsis);
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
    await queryAnalyticsPage.changeMainMetric('Database');
    await queryAnalyticsPage.changeSorting(2);
    await queryAnalyticsPage.filters.selectFilterInGroup('pmm-managed', 'Database');
    await queryAnalyticsPage.addColumn('Bytes Sent');
    await adminPage.applyTimeRange('Last 1 hour');
    await qanOverview.searchByValue('pmm-managed');
    await qanOverview.selectTotalRow();
    await dashboardPage.selectRefreshTimeInterval('5s');
    await queryAnalyticsPage.verifyMainMetric('Database');
    await qanOverview.verifySorting(2, 'asc');
    await queryAnalyticsPage.filters.verifySelectedFilters('pmm-managed');
    await qanOverview.verifyColumnPresent('Bytes Sent');
    await qanDetails.checkDetailsTab();
    /** Skip step until: https://perconadev.atlassian.net/browse/PMM-13052 is fixed
    await adminPage.verifyTimeRange('Last 1 hour'); */
    await qanOverview.verifySearchByValue('pmm-managed');
    await dashboardPage.selectRefreshTimeInterval('Off');
    await queryAnalyticsPage.waitForLoaded();
  },
);
