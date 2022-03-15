Feature('QAN details');

const { adminPage } = inject();

Before(async ({ I, qanPage, qanOverview }) => {
  await I.Authorize();
  I.amOnPage(I.getDashboardUrlWithParams(qanPage.clearUrl, null, null, null, 'now-1h'));
  qanOverview.waitForOverviewLoaded();
});

Scenario(
  'Verify Details section tabs @qan',
  async ({
    I, qanDetails, qanOverview, qanFilters,
  }) => {
    qanFilters.applyFilter('ps-dev');
    qanOverview.selectRow(2);
    qanFilters.waitForFiltersToLoad();
    await within(qanDetails.root, () => {
      I.waitForVisible(qanDetails.buttons.close, 30);
      I.see('Details', qanDetails.getTabLocator('Details'));
      I.see('Example', qanDetails.getTabLocator('Example'));
      I.see('Explain', qanDetails.getTabLocator('Explain'));
      I.see('Tables', qanDetails.getTabLocator('Tables'));
    });
  },
);

Scenario(
  'PMM-T223 - Verify time metrics are AVG per query (not per second) @qan',
  async ({
    I, qanPage, qanOverview, qanFilters, qanDetails,
  }) => {
    const cellValue = qanDetails.getMetricsCellLocator('Query Time', 3);

    I.amOnPage(I.getDashboardUrlWithParams(qanPage.clearUrl, 'ps-dev', null, null, 'now-1', 'now', 'insert'));
    I.waitForElement(qanOverview.elements.querySelector, 30);
    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    I.waitForVisible(cellValue, 30);
    await qanDetails.verifyAvqQueryCount(3600);
    await qanDetails.verifyAvgQueryTime(3600);
  },
);

Scenario(
  'PMM-T13 - Check Explain and Example for supported DBs @qan',
  async ({
    I, qanPage, qanOverview, qanFilters, qanDetails,
  }) => {
    I.amOnPage(I.getDashboardUrlWithParams(qanPage.clearUrl, 'ps-dev', null, null, 'now-1h', 'now', 'insert'));
    I.waitForElement(qanOverview.elements.querySelector, 30);
    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    qanDetails.checkExamplesTab();
    qanDetails.checkExplainTab();
  },
);

Scenario(
  'PMM-T13 - Check Explain and Example for supported DBs - md @qan',
  async ({
    I, qanPage, qanOverview, qanFilters, qanDetails,
  }) => {
    I.amOnPage(I.getDashboardUrlWithParams(qanPage.clearUrl, 'environment', null, null, 'now-1h'));
    I.waitForElement(qanOverview.elements.querySelector, 30);
    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    qanDetails.checkExamplesTab();
    qanDetails.checkExplainTab();
  },
);

Scenario(
  'PMM-T13 - Check Explain and Example for supported DBs - ps @qan',
  async ({
    I, qanPage, qanOverview, qanFilters, qanDetails,
  }) => {
    I.amOnPage(I.getDashboardUrlWithParams(qanPage.clearUrl, 'ps-dev', null, null, 'now-1h'));
    I.waitForElement(qanOverview.elements.querySelector, 30);
    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    qanDetails.checkExamplesTab();
    qanDetails.checkExplainTab();
  },
);

Scenario(
  'PMM-T13 - Check Explain and Example for supported DBs - pdpqsql @qan',
  async ({
    I, qanPage, qanOverview, qanFilters, qanDetails,
  }) => {
    I.amOnPage(I.getDashboardUrlWithParams(qanPage.clearUrl, 'pdpgsql-dev', null, null, 'now-1h'));
    I.waitForElement(qanOverview.elements.querySelector, 30);
    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    qanDetails.checkExamplesTab();
  },
);

Scenario(
  'PMM-T13 - Check Explain and Example for supported DBs - mongodb @qan',
  async ({
    I, qanPage, qanOverview, qanFilters, qanDetails,
  }) => {
    I.amOnPage(I.getDashboardUrlWithParams(qanPage.clearUrl, 'mongodb', null, null, 'now-1h'));
    I.waitForElement(qanOverview.elements.querySelector, 30);
    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    qanDetails.checkExamplesTab();
    qanDetails.checkExplainTab();
  },
);

Scenario(
  'PMM-T245 - Verify that user is able to close the Details section @qan',
  async ({
    I, qanOverview, qanFilters, qanDetails,
  }) => {
    I.waitForElement(qanOverview.elements.querySelector, 30);
    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    I.waitForElement(qanDetails.buttons.close, 30);
    I.click(qanDetails.buttons.close);
    I.waitForInvisible(qanDetails.buttons.close, 30);
    I.dontSeeElement(qanDetails.buttons.close);
  },
);
