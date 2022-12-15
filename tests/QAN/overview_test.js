const assert = require('assert');

Feature('QAN overview').retry(1);

Before(async ({
  I, qanPage, qanOverview, qanFilters,
}) => {
  await I.Authorize();
  I.amOnPage(qanPage.url);
  qanOverview.waitForOverviewLoaded();
  qanFilters.waitForFiltersToLoad();
});

Scenario(
  'PMM-T207 Verify hovering over query in overview table  @qan',
  async ({ I, qanOverview }) => {
    qanOverview.waitForOverviewLoaded();
    I.waitForVisible(qanOverview.elements.firstQueryValue, 30);
    let firstQueryText = await I.grabTextFrom(qanOverview.elements.firstQueryValue);

    firstQueryText = firstQueryText.replace(/ /g, '');
    qanOverview.mouseOverFirstInfoIcon();

    let tooltipQueryText = await I.grabTextFrom(qanOverview.elements.tooltipQueryValue);

    tooltipQueryText = tooltipQueryText.replace(/ /g, '').replace(/\n/g, '');
    assert.ok(firstQueryText === tooltipQueryText, `The request text: ${firstQueryText}, don't match the request text on the tooltip: ${tooltipQueryText}.`);
  },
);

Scenario(
  'PMM-T1061 Verify Plan and PlanID with pg_stat_monitor @qan',
  async ({
    I, adminPage, qanOverview, qanFilters, qanDetails,
  }) => {
    await qanFilters.applyFilter('pdpgsql-dev');
    qanOverview.waitForOverviewLoaded();
    await adminPage.applyTimeRange('Last 12 hours');
    qanOverview.waitForOverviewLoaded();
    await qanOverview.searchByValue('SELECT current_database() datname, schemaname, relname, heap_blks_read, heap_blks_hit, idx_blks_read');
    qanOverview.waitForOverviewLoaded();
    qanOverview.mouseOverFirstInfoIcon();

    let tooltipQueryId = await I.grabTextFrom(qanOverview.elements.tooltipQueryId);

    tooltipQueryId = tooltipQueryId.split(':');
    tooltipQueryId = tooltipQueryId[1].trim();

    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    qanDetails.checkPlanTab();
    await qanDetails.checkPlanTabIsNotEmpty();
    qanDetails.mouseOverPlanInfoIcon();

    let tooltipPlanId = await I.grabTextFrom(qanDetails.elements.tooltipPlanId);

    tooltipPlanId = tooltipPlanId.split(':');
    tooltipPlanId = tooltipPlanId[1].trim();

    assert.notEqual(tooltipQueryId, tooltipPlanId, 'Plan Id should not be equal to Query Id');
    I.click(qanFilters.buttons.resetAll);
    await qanOverview.searchByValue('SELECT * FROM pg_stat_database');
    qanOverview.waitForOverviewLoaded();
    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    qanDetails.checkPlanTab();
    qanDetails.checkPlanTabIsEmpty();
  },
);

Scenario(
  'PMM-T146 Verify user is able to see  chart tooltip for time related metric  @qan',
  async ({ I, qanOverview }) => {
    const ROW_NUMBER = 1;
    const QUERY_TIME_COLUMN_NUMBER = 3;

    qanOverview.waitForOverviewLoaded();
    qanOverview.showTooltip(ROW_NUMBER, QUERY_TIME_COLUMN_NUMBER);
    I.seeElement(qanOverview.elements.latencyChart);
  },
);

Scenario(
  'PMM-T151 Verify that hovering over a non-time metric displays a tooltip without a graph @qan',
  async ({ I, qanOverview }) => {
    const ROW_NUMBER = 1;
    const QUERY_COUNT_COLUMN_NUMBER = 2;

    qanOverview.waitForOverviewLoaded();
    qanOverview.showTooltip(ROW_NUMBER, QUERY_COUNT_COLUMN_NUMBER);
    I.dontSeeElement(qanOverview.elements.latencyChart);
  },
);

Scenario(
  'PMM-T171 Verify that changing the time range doesnt reset sorting, Open the QAN Dashboard and check that sorting works correctly after sorting by another column. @qan',
  async ({ qanOverview, adminPage }) => {
    qanOverview.changeSorting(2);
    qanOverview.verifySorting(2, 'asc');
    qanOverview.waitForOverviewLoaded();
    await adminPage.applyTimeRange('Last 1 hour');
    qanOverview.waitForOverviewLoaded();
    qanOverview.verifySorting(2, 'asc');
    qanOverview.changeSorting(1);
    qanOverview.verifySorting(1, 'asc');
    qanOverview.changeSorting(1);
    qanOverview.verifySorting(1, 'desc');
    qanOverview.verifySorting(2);
  },
);

Scenario(
  'PMM-T156 Verify that by default, queries are sorted by Load, from max to min @qan',
  async ({ qanOverview }) => {
    qanOverview.waitForOverviewLoaded();
    qanOverview.verifySorting(1, 'asc');
  },
);

Scenario(
  'PMM-T183 Verify that "Group by" in the overview table can be changed @qan',
  async ({ I, qanOverview }) => {
    I.waitForText('Query', 30, qanOverview.elements.groupBy);
    qanOverview.waitForOverviewLoaded();
    await qanOverview.changeGroupBy('Database');
    qanOverview.verifyGroupByIs('Database');
  },
);

Scenario(
  'PMM-T187 Verify that the selected row in the overview table is highlighted @qan',
  async ({ I, qanOverview }) => {
    const expectedColor = 'rgb(35, 70, 130)';

    qanOverview.selectRow('2');
    const color = await I.grabCssPropertyFrom(`${qanOverview.elements.selectedRow} > div`, 'background-color');

    assert.ok(color === expectedColor, `Row background color should be ${expectedColor} but it is ${color}`);
  },
);

Scenario(
  'PMM-T133, PMM-T132, PMM-T100 Check Changing Main Metric, PMM-T203 Verify user is able to search for columns by typing @qan',
  async ({ I, qanOverview }) => {
    const metricName = 'Query Count with errors';
    const urlString = 'num_queries_with_errors';
    const newMetric = qanOverview.getColumnLocator(metricName);
    const oldMetric = qanOverview.getColumnLocator('Load');

    I.waitForElement(qanOverview.buttons.addColumn, 30);
    qanOverview.changeMetric('Load', metricName);
    I.seeInCurrentUrl(urlString);
    const url = await I.grabCurrentUrl();

    I.amOnPage(url);
    I.waitForElement(qanOverview.buttons.addColumn, 30);
    I.waitForElement(newMetric, 30);
    I.dontSeeElement(oldMetric);
  },
);

Scenario(
  'PMM-T99 Verify User is able to add new metric, PMM-T222 Verify `Add column` dropdown works @qan',
  async ({ I, qanOverview }) => {
    const metricName = 'Query Count with errors';
    const urlString = 'num_queries_with_errors';
    const newMetric = qanOverview.getColumnLocator(metricName);
    const metricInDropdown = qanOverview.getMetricLocatorInDropdown(metricName);
    const oldMetric = qanOverview.getColumnLocator('Load');

    I.waitForElement(qanOverview.getColumnLocator('Add column'), 30);
    I.waitForElement(oldMetric, 30);
    I.doubleClick(qanOverview.getColumnLocator('Add column'));
    I.waitForElement(qanOverview.elements.newMetricDropdown, 30);
    I.fillField(qanOverview.fields.columnSearchField, metricName);
    I.click(metricInDropdown);
    qanOverview.waitForOverviewLoaded();
    I.waitForElement(newMetric, 30);
    I.seeElement(newMetric);
    I.seeElement(oldMetric);
    I.seeInCurrentUrl(urlString);
    const url = await I.grabCurrentUrl();

    I.amOnPage(url);
    qanOverview.waitForOverviewLoaded();
    I.waitForElement(qanOverview.buttons.addColumn, 30);
    I.waitForElement(newMetric, 30);
    I.seeElement(oldMetric);
    I.seeElement(newMetric);
  },
);

Scenario(
  'PMM-T135 - Verify user is not able to add duplicate metric to the overview column @qan',
  async ({ I, qanOverview }) => {
    const columnName = 'Load';
    const column = qanOverview.getColumnLocator(columnName);

    I.waitForVisible(column, 30);
    I.seeElement(column);
    I.click(qanOverview.buttons.addColumn);
    I.fillField(qanOverview.fields.columnSearchField, columnName);
    I.waitForVisible(qanOverview.elements.noDataIcon, 30);
    I.seeElement(qanOverview.elements.noDataIcon);
  },
);

xScenario(
  'PMM-T219 - Verify that user is able to scroll up/down and resize the overview table @qan',
  async ({ I, qanOverview, qanDetails }) => {
    const columnsToAdd = [
      'Bytes Sent',
      'Reading Blocks Time',
      'Local Blocks Read',
      'Local Blocks Dirtied',
      'Temp Blocks Read',
      'Local Blocks Written',
      'Full Scan',
    ];

    for (const i in columnsToAdd) {
      qanOverview.addSpecificColumn(columnsToAdd[i]);
    }

    I.waitForElement(qanOverview.getColumnLocator('Local Blocks Written'), 30);
    I.scrollTo(qanOverview.getColumnLocator('Local Blocks Written'), 30);
    I.moveCursorTo(qanOverview.elements.querySelector);
    I.waitForVisible(qanOverview.elements.querySelector);
    I.click(qanOverview.elements.querySelector);
    I.scrollTo(qanOverview.getRowLocator(10));
    I.waitForVisible(qanOverview.getColumnLocator('Query Time'), 30);
    I.waitForVisible(qanDetails.elements.resizer, 30);
    I.dragAndDrop(qanDetails.elements.resizer, qanOverview.getColumnLocator('Query Time'));
    I.scrollTo(qanOverview.getColumnLocator('Query Time'));
  },
);

Scenario(
  'PMM-T156 Verify Queries are sorted by Load by Default Sorting from Max to Min, verify Sorting for Metrics works @qan',
  async ({ qanOverview }) => {
    qanOverview.verifySorting(1, 'asc');
    await qanOverview.verifyMetricsSorted('Load', 3, 'down');
    qanOverview.changeSorting(1);
    qanOverview.verifySorting(1, 'desc');
    await qanOverview.verifyMetricsSorted('Load', 3, 'up');
    qanOverview.changeSorting(2);
    qanOverview.verifySorting(2, 'asc');
    await qanOverview.verifyMetricsSorted('Query Count', 4, 'down');
    qanOverview.changeSorting(2);
    qanOverview.verifySorting(2, 'desc');
    await qanOverview.verifyMetricsSorted('Query Count', 4, 'up');
    qanOverview.changeSorting(3);
    qanOverview.verifySorting(3, 'asc');
    await qanOverview.verifyMetricsSorted('Query Time', 5, 'down');
    qanOverview.changeSorting(3);
    qanOverview.verifySorting(3, 'desc');
    await qanOverview.verifyMetricsSorted('Query Time', 5, 'up');
  },
);

Scenario(
  'PMM-T179 - Verify user is able to hover sparkline buckets and see correct Query Count Value @qan',
  async ({ I, qanOverview }) => {
    qanOverview.waitForOverviewLoaded();
    const firstCell = qanOverview.getCellValueLocator(3, 2);

    const [queryCount] = (await I.grabTextFrom(firstCell)).split(' ');

    I.moveCursorTo(firstCell);
    I.waitForVisible(qanOverview.elements.tooltip, 20);
    await qanOverview.verifyTooltipValue(queryCount);
  },
);

Scenario(
  'PMM-T179 - Verify user is able to hover sparkline buckets and see correct Query Time Value @qan',
  async ({ I, qanOverview }) => {
    qanOverview.waitForOverviewLoaded();
    const secondCell = qanOverview.getCellValueLocator(3, 3);

    const queryTime = await I.grabTextFrom(secondCell);

    I.moveCursorTo(secondCell);
    I.waitForVisible(qanOverview.elements.latencyChart, 20);
    await qanOverview.verifyTooltipValue(`Per query : ${queryTime}`);
  },
);

Scenario(
  'PMM-T204 - Verify small and N/A values on sparkline @qan',
  async ({ I, qanOverview }) => {
    const firstCell = qanOverview.getCellValueLocator(0, 1);
    const secondCell = qanOverview.getCellValueLocator(3, 3);

    qanOverview.changeSorting(1);
    qanOverview.verifySorting(1, 'desc');
    I.waitForVisible(firstCell, 10);
    I.moveCursorTo(firstCell);
    I.waitForVisible(qanOverview.elements.tooltipQPSValue, 10);
    qanOverview.changeMetric('Query Time', 'Innodb Queue Wait');
    qanOverview.waitForOverviewLoaded();
    I.waitForVisible(secondCell, 10);
    I.moveCursorTo(secondCell);
    I.dontSeeElement(qanOverview.elements.tooltip);
    I.dontSeeElement(qanOverview.elements.tooltipQPSValue);
  },
);

Scenario(
  'PMM-T412 - Verify user is able to search by part of query @qan',
  async ({
    I, qanOverview, adminPage,
  }) => {
    const query = 'SELECT * FROM pg_stat_bgwriter';

    qanOverview.waitForOverviewLoaded();
    await adminPage.applyTimeRange('Last 1 hour');
    qanOverview.waitForOverviewLoaded();
    await qanOverview.searchByValue(query);
    I.waitForElement(qanOverview.elements.querySelector, 30);
    const firstQueryText = await I.grabTextFrom(qanOverview.elements.firstQueryValue);

    assert.ok(firstQueryText.startsWith(query), `The Searched Query text was: "${query}", don't match the result text in overview for 1st result: "${firstQueryText}"`);
  },
);

Scenario(
  'PMM-T417 Verify user is able to search by Database @qan',
  async ({ I, qanOverview }) => {
    const groupBy = 'Database';
    const query = 'postgres';

    I.waitForText('Query', 30, qanOverview.elements.groupBy);
    qanOverview.waitForOverviewLoaded();
    await qanOverview.changeGroupBy(groupBy);
    qanOverview.verifyGroupByIs(groupBy);
    qanOverview.waitForOverviewLoaded();
    await qanOverview.searchByValue(query);
    I.waitForElement(qanOverview.elements.querySelector, 30);
    const firstQueryText = await I.grabTextFrom(qanOverview.elements.firstQueryValue);

    assert.ok(firstQueryText === query, `The Searched text was: ${query}, don't match the result text in overview for 1st result: ${firstQueryText}`);
  },
);

Scenario(
  'PMM-T127 Verify user is able to Group By overview table results @qan',
  async ({ I, qanOverview }) => {
    I.waitForText('Query', 30, qanOverview.elements.groupBy);
    qanOverview.waitForOverviewLoaded();
    await qanOverview.changeGroupBy('Service Name');
    qanOverview.verifyGroupByIs('Service Name');
    await qanOverview.changeGroupBy('Database');
    qanOverview.verifyGroupByIs('Database');
    await qanOverview.changeGroupBy('Schema');
    qanOverview.verifyGroupByIs('Schema');
    await qanOverview.changeGroupBy('User Name');
    qanOverview.verifyGroupByIs('User Name');
    await qanOverview.changeGroupBy('Client Host');
    qanOverview.verifyGroupByIs('Client Host');
    await qanOverview.changeGroupBy('Query');
    qanOverview.verifyGroupByIs('Query');
  },
);

Scenario(
  'PMM-T411 PMM-T400 PMM-T414 Verify search filed is displayed, Verify user is able to search the query id specified time range, Verify searching by Query ID @qan',
  async ({ I, qanOverview }) => {
    qanOverview.waitForOverviewLoaded();
    I.waitForVisible(qanOverview.elements.firstQueryValue, 30);
    const firstQueryText = await I.grabTextFrom(qanOverview.elements.firstQueryValue);

    qanOverview.mouseOverFirstInfoIcon();

    let tooltipQueryId = await I.grabTextFrom(qanOverview.elements.tooltipQueryId);

    tooltipQueryId = tooltipQueryId.split(':');

    // fetch the query id field value, split to get just the queryId
    tooltipQueryId = tooltipQueryId[1].trim();
    await qanOverview.searchByValue(tooltipQueryId);
    I.waitForElement(qanOverview.elements.querySelector, 30);
    const firstQuerySearchText = await I.grabTextFrom(qanOverview.elements.firstQueryValue);

    assert.ok(firstQuerySearchText === firstQueryText, `The search with Query Id: ${tooltipQueryId} was supposed to result in Query with value: ${firstQueryText} but the resulted query found is ${firstQuerySearchText}`);
  },
);

Scenario(
  'PMM-T134 Verify user is able to remove metric from the overview table @qan',
  async ({
    I, qanOverview, qanDetails, qanFilters,
  }) => {
    const metricName = 'Query Count';

    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    I.waitForElement(qanDetails.buttons.close, 30);
    I.seeElement(qanOverview.getQANMetricHeader(metricName));
    qanOverview.removeMetricFromOverview(metricName);
    const url = await I.grabCurrentUrl();

    I.amOnPage(url);
    qanOverview.waitForOverviewLoaded();
    I.waitForElement(qanOverview.buttons.addColumn, 30);
    I.dontSeeElement(qanOverview.getQANMetricHeader(metricName));
  },
);

Scenario(
  'PMM-T220 Verify that last column cant be removed from Overview table @qan',
  async ({
    I, qanOverview, qanDetails, qanFilters,
  }) => {
    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    I.waitForElement(qanDetails.buttons.close, 30);
    I.seeElement(qanOverview.getQANMetricHeader('Query Count'));
    qanOverview.removeMetricFromOverview('Query Count');
    qanOverview.removeMetricFromOverview('Query Time');
    const column = qanOverview.getColumnLocator('Load');

    I.waitForElement(column);
    I.click(column);
    I.waitForElement(qanOverview.fields.columnSearchField, 10);
    I.fillField(qanOverview.fields.columnSearchField, 'Remove column');
    I.dontSeeElement(qanOverview.elements.removeMetricColumn);
  },
);
