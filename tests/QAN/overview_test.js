const assert = require('assert');

Feature('QAN overview');

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
  async ({ I, queryAnalyticsPage }) => {
    queryAnalyticsPage.waitForLoaded();
    I.waitForVisible(queryAnalyticsPage.data.elements.queryRowValue(1), 30);
    let firstQueryText = await I.grabTextFrom(queryAnalyticsPage.data.elements.queryRowValue(1));

    firstQueryText = firstQueryText.replace(/ /g, '');
    queryAnalyticsPage.data.mouseOverInfoIcon(1);

    let tooltipQueryText = await I.grabTextFrom(queryAnalyticsPage.data.elements.queryTooltipValue);

    tooltipQueryText = tooltipQueryText.replace(/ /g, '').replace(/\n/g, '');
    assert.ok(firstQueryText === tooltipQueryText, `The request text: ${firstQueryText}, don't match the request text on the tooltip: ${tooltipQueryText}.`);
  },
);

Scenario(
  'PMM-T1061 Verify Plan and PlanID with pg_stat_monitor @qan',
  async ({
    I, adminPage, qanOverview, qanFilters, qanDetails, queryAnalyticsPage,
  }) => {
    await queryAnalyticsPage.filters.selectFilter('pdpgsql-dev');
    queryAnalyticsPage.waitForLoaded();
    await adminPage.applyTimeRange('Last 12 hours');
    queryAnalyticsPage.waitForLoaded();
    await qanOverview.searchByValue('SELECT current_database() datname, schemaname, relname, heap_blks_read, heap_blks_hit, idx_blks_read');
    await qanOverview.waitForOverviewLoaded();
    await qanOverview.mouseOverFirstInfoIcon();

    let tooltipQueryId = await I.grabTextFrom(qanOverview.elements.tooltipQueryId);

    tooltipQueryId = tooltipQueryId.split(':');
    tooltipQueryId = tooltipQueryId[1].trim();
    await qanOverview.hideTooltip();

    await qanOverview.selectRow(1);
    await qanFilters.waitForFiltersToLoad();
    await qanDetails.checkPlanTab();
    await qanDetails.checkPlanTabIsNotEmpty();
    await qanDetails.mouseOverPlanInfoIcon();

    let tooltipPlanId = await I.grabTextFrom(qanDetails.elements.tooltipPlanId);

    tooltipPlanId = tooltipPlanId.split(':');
    tooltipPlanId = tooltipPlanId[1].trim();
    await qanOverview.hideTooltip();
    assert.notEqual(tooltipQueryId, tooltipPlanId, 'Plan Id should not be equal to Query Id');
    await I.click(qanFilters.buttons.resetAll);
    await qanOverview.searchByValue('SELECT * FROM pg_stat_database');
    await qanOverview.waitForOverviewLoaded();
    await qanOverview.selectRow(1);
    await qanFilters.waitForFiltersToLoad();
    await qanDetails.checkPlanTab();
    await qanDetails.checkPlanTabIsEmpty();
  },
);

Scenario(
  'PMM-T146 Verify user is able to see  chart tooltip for time related metric  @qan',
  async ({ I, queryAnalyticsPage }) => {
    queryAnalyticsPage.waitForLoaded();
    queryAnalyticsPage.data.showTooltip(1, 3);
    I.seeElement(queryAnalyticsPage.data.elements.latencyChart);
  },
);

Scenario(
  'PMM-T151 Verify that hovering over a non-time metric displays a tooltip without a graph @qan',
  async ({ I, queryAnalyticsPage }) => {
    queryAnalyticsPage.waitForLoaded();
    queryAnalyticsPage.data.showTooltip(1, 2);
    I.dontSeeElement(queryAnalyticsPage.data.elements.latencyChart);
  },
);

Scenario(
  'PMM-T171 Verify that changing the time range doesnt reset sorting, Open the QAN Dashboard and check that sorting works correctly after sorting by another column. @qan',
  async ({ adminPage, queryAnalyticsPage }) => {
    queryAnalyticsPage.changeSorting(2);
    queryAnalyticsPage.data.verifySorting(2, 'asc');
    queryAnalyticsPage.waitForLoaded();
    await adminPage.applyTimeRange('Last 1 hour');
    queryAnalyticsPage.waitForLoaded();
    queryAnalyticsPage.data.verifySorting(2, 'asc');
    queryAnalyticsPage.changeSorting(1);
    queryAnalyticsPage.data.verifySorting(1, 'asc');
    queryAnalyticsPage.changeSorting(1);
    queryAnalyticsPage.data.verifySorting(1, 'desc');
    queryAnalyticsPage.data.verifySorting(2);
  },
);

Scenario(
  'PMM-T156 Verify that by default, queries are sorted by Load, from max to min @qan',
  async ({ queryAnalyticsPage }) => {
    queryAnalyticsPage.waitForLoaded();
    queryAnalyticsPage.data.verifySorting(1, 'asc');
  },
);

Scenario(
  'PMM-T183 Verify that "Group by" in the overview table can be changed @qan',
  async ({ I, queryAnalyticsPage }) => {
    I.waitForText('Query', 30, queryAnalyticsPage.elements.selectedMainMetric());
    queryAnalyticsPage.waitForLoaded();
    await queryAnalyticsPage.changeMainMetric('Database');
    queryAnalyticsPage.verifyMainMetric('Database');
  },
);

Scenario(
  'PMM-T187 Verify that the selected row in the overview table is highlighted @qan',
  async ({ I, queryAnalyticsPage }) => {
    const expectedColor = 'rgb(35, 70, 130)';

    queryAnalyticsPage.data.selectRow('2');
    const color = await I.grabCssPropertyFrom(`${queryAnalyticsPage.data.elements.selectedRow} > div`, 'background-color');

    assert.ok(color === expectedColor, `Row background color should be ${expectedColor} but it is ${color}`);
  },
);

Scenario(
  'PMM-T133, PMM-T132, PMM-T100 Check Changing Main Metric, PMM-T203 Verify user is able to search for columns by typing @qan',
  async ({ I, queryAnalyticsPage }) => {
    const metricName = 'Query Count with errors';

    await I.waitForElement(queryAnalyticsPage.buttons.addColumnButton, 30);
    await queryAnalyticsPage.data.changeMetric('Load', metricName);
    await I.seeInCurrentUrl('num_queries_with_errors');
    const url = await I.grabCurrentUrl();

    await I.amOnPage(url);
    await I.waitForElement(queryAnalyticsPage.buttons.addColumnButton, 30);
    await I.waitForElement(queryAnalyticsPage.data.fields.columnHeader(metricName), 30);
    await I.dontSeeElement(queryAnalyticsPage.data.fields.columnHeader('Load'));
  },
);

Scenario(
  'PMM-T99 Verify User is able to add new metric, PMM-T222 Verify `Add column` dropdown works @qan',
  async ({ I, qanOverview, queryAnalyticsPage }) => {
    const metricName = 'Query Count with errors';
    const urlString = 'num_queries_with_errors';
    const newMetric = queryAnalyticsPage.data.fields.columnHeader(metricName);
    const oldMetric = queryAnalyticsPage.data.fields.columnHeader('Load');

    queryAnalyticsPage.addColumn(metricName);
    queryAnalyticsPage.waitForLoaded();
    I.waitForElement(newMetric, 30);
    I.seeElement(newMetric);
    I.seeElement(oldMetric);
    I.seeInCurrentUrl(urlString);
    const url = await I.grabCurrentUrl();

    I.amOnPage(url);
    queryAnalyticsPage.waitForLoaded();
    I.waitForElement(queryAnalyticsPage.buttons.addColumnButton, 30);
    I.waitForElement(newMetric, 30);
    I.seeElement(oldMetric);
    I.seeElement(newMetric);
  },
);

Scenario(
  'PMM-T135 - Verify user is not able to add duplicate metric to the overview column @qan',
  async ({ I, queryAnalyticsPage }) => {
    const columnName = 'Load';
    const column = queryAnalyticsPage.data.fields.columnHeader(columnName);

    await I.waitForVisible(column, 30);
    await I.seeElement(column);
    await I.fillField(queryAnalyticsPage.buttons.addColumn, columnName);
    await I.waitForVisible(queryAnalyticsPage.data.elements.addColumnNoDataIcon, 30);
    await I.seeElement(queryAnalyticsPage.data.elements.addColumnNoDataIcon);
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
  async ({ queryAnalyticsPage }) => {
    queryAnalyticsPage.data.verifySorting(1, 'asc');
    await queryAnalyticsPage.data.verifyMetricsSorted('Load', 3, 'down');
    queryAnalyticsPage.changeSorting(1);
    queryAnalyticsPage.data.verifySorting(1, 'desc');
    await queryAnalyticsPage.data.verifyMetricsSorted('Load', 3, 'up');
    queryAnalyticsPage.changeSorting(2);
    queryAnalyticsPage.data.verifySorting(2, 'asc');
    await queryAnalyticsPage.data.verifyMetricsSorted('Query Count', 4, 'down');
    queryAnalyticsPage.changeSorting(2);
    queryAnalyticsPage.data.verifySorting(2, 'desc');
    await queryAnalyticsPage.data.verifyMetricsSorted('Query Count', 4, 'up');
    queryAnalyticsPage.changeSorting(3);
    queryAnalyticsPage.data.verifySorting(3, 'asc');
    await queryAnalyticsPage.data.verifyMetricsSorted('Query Time', 5, 'down');
    queryAnalyticsPage.changeSorting(3);
    queryAnalyticsPage.data.verifySorting(3, 'desc');
    await queryAnalyticsPage.data.verifyMetricsSorted('Query Time', 5, 'up');
  },
);

Scenario(
  'PMM-T179 - Verify user is able to hover sparkline buckets and see correct Query Count Value @qan',
  async ({ I, queryAnalyticsPage }) => {
    queryAnalyticsPage.waitForLoaded();
    const firstCell = queryAnalyticsPage.data.elements.queryValue(3, 2);

    const [queryCount] = (await I.grabTextFrom(firstCell)).split(' ');

    I.moveCursorTo(firstCell);
    I.waitForVisible(queryAnalyticsPage.data.elements.metricTooltip, 20);
    I.assertTrue((await I.grabTextFrom(queryAnalyticsPage.data.elements.tooltipQPSValue)).includes(queryCount), `Expected QPS value: ${queryCount} does not equal displayed one: ${await I.grabTextFrom(queryAnalyticsPage.data.elements.tooltipQPSValue)}`);
  },
);

Scenario(
  'PMM-T179 - Verify user is able to hover sparkline buckets and see correct Query Time Value @qan',
  async ({ I, queryAnalyticsPage }) => {
    queryAnalyticsPage.waitForLoaded();
    const secondCell = queryAnalyticsPage.data.elements.queryValue(3, 3);

    const queryTime = await I.grabTextFrom(secondCell);

    I.moveCursorTo(secondCell);
    I.waitForVisible(queryAnalyticsPage.data.elements.latencyChart, 20);
    await queryAnalyticsPage.data.verifyTooltipValue(`Per query : ${queryTime}`);
  },
);

Scenario(
  'PMM-T204 - Verify small and N/A values on sparkline @qan',
  async ({ I, queryAnalyticsPage }) => {
    const firstCell = queryAnalyticsPage.data.elements.queryValue(0, 1);
    const secondCell = queryAnalyticsPage.data.elements.queryValue(3, 3);

    queryAnalyticsPage.changeSorting(1);
    queryAnalyticsPage.data.verifySorting(1, 'desc');
    I.waitForVisible(firstCell, 10);
    I.moveCursorTo(firstCell);
    I.waitForVisible(queryAnalyticsPage.data.elements.tooltipQPSValue, 10);
    queryAnalyticsPage.data.changeMetric('Query Time', 'Innodb Queue Wait');
    queryAnalyticsPage.waitForLoaded();
    I.waitForVisible(secondCell, 10);
    I.moveCursorTo(secondCell);
    I.dontSeeElement(queryAnalyticsPage.data.elements.tooltip);
    I.dontSeeElement(queryAnalyticsPage.data.elements.tooltipQPSValue);
  },
).retry(2);

Scenario(
  'PMM-T412 - Verify user is able to search by part of query @qan',
  async ({
    I, adminPage, queryAnalyticsPage,
  }) => {
    const query = 'SELECT current_database() datname';

    queryAnalyticsPage.waitForLoaded();
    await adminPage.applyTimeRange('Last 3 hours');
    queryAnalyticsPage.waitForLoaded();
    queryAnalyticsPage.data.searchByValue(query);
    await I.waitForElement(queryAnalyticsPage.data.elements.queryRows, 30);
    const firstQueryText = await I.grabTextFrom(queryAnalyticsPage.data.elements.queryRowValue(1));

    assert.ok(firstQueryText.startsWith(query), `The Searched Query text was: "${query}", don't match the result text in overview for 1st result: "${firstQueryText}"`);
  },
);

Scenario(
  'PMM-T417 Verify user is able to search by Database @qan',
  async ({ I, qanOverview, queryAnalyticsPage }) => {
    const groupBy = 'Database';
    const query = 'postgres';

    I.waitForText('Query', 30, queryAnalyticsPage.elements.selectedMainMetric());
    queryAnalyticsPage.waitForLoaded();
    await queryAnalyticsPage.changeMainMetric(groupBy);
    queryAnalyticsPage.verifyMainMetric(groupBy);
    queryAnalyticsPage.waitForLoaded();
    queryAnalyticsPage.data.searchByValue(query);
    I.waitForElement(queryAnalyticsPage.data.elements.queryRows, 30);
    const firstQueryText = await I.grabTextFrom(queryAnalyticsPage.data.elements.queryRowValue(1));

    assert.ok(firstQueryText === query, `The Searched text was: ${query}, don't match the result text in overview for 1st result: ${firstQueryText}`);
  },
);

Scenario(
  'PMM-T127 Verify user is able to Group By overview table results @qan',
  async ({ I, queryAnalyticsPage }) => {
    I.waitForText('Query', 30, queryAnalyticsPage.elements.selectedMainMetric());
    queryAnalyticsPage.waitForLoaded();
    await queryAnalyticsPage.changeMainMetric('Service Name');
    queryAnalyticsPage.verifyMainMetric('Service Name');
    await queryAnalyticsPage.changeMainMetric('Database');
    queryAnalyticsPage.verifyMainMetric('Database');
    await queryAnalyticsPage.changeMainMetric('Schema');
    queryAnalyticsPage.verifyMainMetric('Schema');
    await queryAnalyticsPage.changeMainMetric('User Name');
    queryAnalyticsPage.verifyMainMetric('User Name');
    await queryAnalyticsPage.changeMainMetric('Client Host');
    queryAnalyticsPage.verifyMainMetric('Client Host');
    await queryAnalyticsPage.changeMainMetric('Query');
    queryAnalyticsPage.verifyMainMetric('Query');
  },
);

Scenario(
  'PMM-T411 PMM-T400 PMM-T414 Verify search filed is displayed, Verify user is able to search the query id specified time range, Verify searching by Query ID @qan',
  async ({ I, queryAnalyticsPage }) => {
    queryAnalyticsPage.waitForLoaded();
    I.waitForVisible(queryAnalyticsPage.data.elements.queryRows, 30);
    const firstQueryText = await I.grabTextFrom(queryAnalyticsPage.data.elements.queryValue(1, 2));

    queryAnalyticsPage.data.mouseOverInfoIcon(1);

    let tooltipQueryId = await I.grabTextFrom(queryAnalyticsPage.data.elements.queryTooltipId);

    tooltipQueryId = tooltipQueryId.split(':');

    // fetch the query id field value, split to get just the queryId
    tooltipQueryId = tooltipQueryId[1].trim();
    await queryAnalyticsPage.data.searchByValue(tooltipQueryId);
    I.waitForElement(queryAnalyticsPage.data.elements.queryRows, 30);
    const firstQuerySearchText = await I.grabTextFrom(queryAnalyticsPage.data.elements.queryValue(1, 2));

    assert.ok(firstQuerySearchText === firstQueryText, `The search with Query Id: ${tooltipQueryId} was supposed to result in Query with value: ${firstQueryText} but the resulted query found is ${firstQuerySearchText}`);
  },
);

Scenario(
  'PMM-T134 Verify user is able to remove metric from the overview table @qan',
  async ({
    I, qanOverview, qanDetails, qanFilters,
  }) => {
    const metricName = 'Query Count';

    await qanOverview.selectRow(1);
    await qanFilters.waitForFiltersToLoad();
    await I.waitForElement(qanDetails.buttons.close, 30);
    await I.seeElement(qanOverview.getQANMetricHeader(metricName));
    await qanOverview.removeMetricFromOverview(metricName);
    const url = await I.grabCurrentUrl();

    await I.amOnPage(url);
    await qanOverview.waitForOverviewLoaded();
    await I.waitForElement(qanOverview.buttons.addColumn, 30);
    await I.dontSeeElement(qanOverview.getQANMetricHeader(metricName));
  },
);

Scenario(
  'PMM-T220 Verify that last column can\'t be removed from Overview table @qan',
  async ({
    I, qanOverview, qanDetails, qanFilters,
  }) => {
    await qanOverview.selectRow(1);
    await qanFilters.waitForFiltersToLoad();
    await I.waitForElement(qanDetails.buttons.close, 30);
    await I.seeElement(qanOverview.getQANMetricHeader('Query Count'));
    await qanOverview.removeMetricFromOverview('Query Count');
    await qanOverview.removeMetricFromOverview('Query Time');
    const column = qanOverview.getColumnLocator('Load');

    await I.waitForElement(column);
    await I.click(column);
    await I.waitForElement(qanOverview.fields.columnSearchField, 10);
    await I.fillField(qanOverview.fields.columnSearchField, 'Remove column');
    await I.dontSeeElement(qanOverview.elements.removeMetricColumn);
  },
);

Scenario(
  '@PMM-T1699 Verify that query time is shown in UTC timezone after hovering Load graph for query if user selected UTC timezone @qan @debug',
  async ({ I, adminPage, qanOverview }) => {
    qanOverview.waitForOverviewLoaded();
    const firstLoadCell = qanOverview.getLoadLocator(2);

    I.moveCursorTo(firstLoadCell);
    let timestamp = await I.grabTextFrom(qanOverview.elements.tooltipContent);

    const clientTimeOffset = new Intl.NumberFormat('en-US', {
      minimumIntegerDigits: 2,
      signDisplay: 'exceptZero',
    }).format(-new Date().getTimezoneOffset() / 60);
    const clientTimeZone = `${clientTimeOffset}:00`;

    I.assertContain(
      timestamp,
      clientTimeOffset,
      `Timestamp does not contain expected local time offset, but contains ${timestamp}`,
    );

    adminPage.applyTimeZone('Coordinated Universal Time');
    I.click(qanOverview.buttons.refresh);
    I.moveCursorTo(firstLoadCell);
    timestamp = await I.grabTextFrom(qanOverview.elements.tooltipContent);

    I.assertContain(
      timestamp,
      '+00:00',
      `Timestamp does not contain expected zero UTC time offset, but contains ${timestamp}`,
    );
  },
);
