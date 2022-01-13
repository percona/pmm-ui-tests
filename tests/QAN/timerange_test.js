Feature('QAN timerange').retry(1);

Before(async ({
  I, qanPage, qanOverview, qanFilters,
}) => {
  await I.Authorize();
  I.amOnPage(qanPage.url);
  qanOverview.waitForOverviewLoaded();
  qanFilters.waitForFiltersToLoad();
});

Scenario(
  'Open the QAN Dashboard and check that changing the time range resets current page to the first. @qan',
  async ({ adminPage, qanPagination, qanOverview }) => {
    qanPagination.selectPage(2);
    adminPage.applyTimeRange('Last 3 hours');
    qanOverview.waitForOverviewLoaded();
    await qanPagination.verifyActivePage(1);
  },
);

Scenario(
  'PMM-T167 Open the QAN Dashboard and check that changing the time range updates the overview table, URL. @nightly @qan',
  async ({
    I, adminPage, qanDetails, qanFilters, qanOverview,
  }) => {
    I.seeInCurrentUrl('from=now-5m&to=now');
    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    I.seeElement(qanDetails.root);

    adminPage.applyTimeRange('Last 3 hours');
    qanOverview.waitForOverviewLoaded();
    I.seeInCurrentUrl('from=now-3h&to=now');
    I.dontSeeElement(qanDetails.root);
    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    I.seeElement(qanDetails.root);
  },
);

Scenario(
  'PMM-T170 Open the QAN Dashboard and check that changing the time range doesn\'t clear "Group by". @qan',
  async ({ I, adminPage, qanOverview }) => {
    const group = 'Client Host';

    I.waitForText('Query', 30, qanOverview.elements.groupBy);
    await qanOverview.changeGroupBy(group);
    adminPage.applyTimeRange('Last 24 hours');
    qanOverview.waitForOverviewLoaded();
    qanOverview.verifyGroupByIs(group);
  },
);

Scenario(
  'Open the QAN Dashboard and check that changing the time range doesn\'t reset sorting. @qan',
  async ({ adminPage, qanOverview }) => {
    await qanOverview.changeSorting(1);
    adminPage.applyTimeRange('Last 24 hours');
    qanOverview.waitForOverviewLoaded();
    qanOverview.verifySorting(1, 'desc');
  },
);
