const moment = require('moment');
const assert = require('assert');

Feature('QAN timerange').retry(1);

Before(async ({ I, queryAnalyticsPage }) => {
  await I.Authorize();
  I.amOnPage(I.buildUrlWithParams(queryAnalyticsPage.url, { from: 'now-5m' }));
  queryAnalyticsPage.waitForLoaded();
});

// https://perconadev.atlassian.net/browse/PMM-13052 blocked
Scenario.skip(
  'Open the QAN Dashboard and check that changing the time range resets current page to the first. @qan',
  async ({ adminPage }) => {
    // await anPagination.selectPage(2);
    await adminPage.applyTimeRange('Last 3 hours');
    // await anOverview.waitForOverviewLoaded();
    // await anPagination.verifyActivePage(1);
  },
);

Scenario(
  'PMM-T167 Open the QAN Dashboard and check that changing the time range updates the overview table, URL @qan',
  async ({
    I, adminPage, queryAnalyticsPage,
  }) => {
    I.seeInCurrentUrl('from=now-5m&to=now');
    queryAnalyticsPage.data.selectRow(1);
    queryAnalyticsPage.waitForLoaded();
    I.seeElement(queryAnalyticsPage.data.root);

    await adminPage.applyTimeRange('Last 3 hours');
    queryAnalyticsPage.waitForLoaded();
    I.seeInCurrentUrl('from=now-3h&to=now');
    queryAnalyticsPage.data.selectRow(1);
    queryAnalyticsPage.waitForLoaded();
    I.seeElement(queryAnalyticsPage.data.root);
  },
);

Scenario.skip(
  'PMM-T432 Open the QAN Dashboard and check that changing absolute time range updates the overview table, URL @qan',
  async ({
    I, adminPage,
  }) => {
    const date = moment().format('YYYY-MM-DD');
    const fromString = Date.parse(`${date} 00:00:00`);
    const toString = Date.parse(`${date} 23:59:59`);

    await I.seeInCurrentUrl('from=now-5m&to=now');
    // await anOverview.selectRow(1);
    // await anFilters.waitForFiltersToLoad();
    // await I.seeElement(anDetails.root);
    await adminPage.setAbsoluteTimeRange(`${date} 00:00:00`, `${date} 23:59:59`);
    await I.seeInCurrentUrl(`from=${fromString}&to=${toString}`);
    // await anOverview.selectRow(1);
    // await anFilters.waitForFiltersToLoad();
    // await I.seeElement(anDetails.root);
  },
);

Scenario(
  'PMM-T170 Open the QAN Dashboard and check that changing the time range doesn\'t clear "Group by". @qan',
  async ({ I, adminPage, queryAnalyticsPage }) => {
    const group = 'Client Host';

    I.waitForText('Query', 30, queryAnalyticsPage.data.elements.selectedMainMetric());
    await queryAnalyticsPage.data.changeMainMetric(group);
    await adminPage.applyTimeRange('Last 24 hours');
    queryAnalyticsPage.waitForLoaded();
    const mainMetricsText = await I.grabTextFrom(queryAnalyticsPage.data.elements.selectedMainMetric());

    I.assertEqual(
      group,
      mainMetricsText,
      `Expected main metric ${group} and real main metric ${mainMetricsText} are not equal`,
    );
  },
);

Scenario(
  'Open the QAN Dashboard and check that changing the time range doesn\'t reset sorting. @qan',
  async ({ adminPage, queryAnalyticsPage }) => {
    queryAnalyticsPage.changeSorting(1);
    await adminPage.applyTimeRange('Last 24 hours');
    queryAnalyticsPage.waitForLoaded();
    queryAnalyticsPage.data.verifySorting(1, 'desc');
  },
);

Scenario.skip(
  'PMM-T1138 - Verify QAN Copy Button for URL @qan',
  async ({ I, adminPage }) => {
    await adminPage.applyTimeRange('Last 12 hours');

    const dateTime = moment().format('x');

    // anOverview.waitForOverviewLoaded();
    // anOverview.selectRow(2);
    // I.click(anOverview.buttons.copyButton);
    I.waitForVisible(I.getPopUpLocator(), 10);

    // const url = new URL(await I.grabTextFrom(anOverview.elements.clipboardLink));
    const toTimeFromUrl1 = url.searchParams.get('to');

    assert.ok(Math.abs(dateTime - toTimeFromUrl1) < 30000, 'Difference between moment time and first copied time must be less then half of minute');

    I.wait(30);
    I.refreshPage();
    // anOverview.waitForOverviewLoaded();
    // I.click(anOverview.buttons.copyButton);
    I.waitForVisible(I.getPopUpLocator(), 10);

    // const url2 = new URL(await I.grabTextFrom(anOverview.elements.clipboardLink));
    const toTimeFromUrl2 = url2.searchParams.get('to');

    assert.ok(Math.abs(toTimeFromUrl1 - toTimeFromUrl2) < 60000, 'Difference between moment time and second copied time must be less then one minute');
    assert.notEqual(toTimeFromUrl1, toTimeFromUrl2, 'TimeFromUrl2 must not be the same as timeFromUrl1');

    I.openNewTab();
    // I.amOnPage(url.toString());
    // anOverview.waitForOverviewLoaded();
    // I.waitForVisible(anOverview.getSelectedRowLocator(2));
  },
);

Scenario(
  'PMM-T1140 - Verify relative time range copy URL from browser @qan',
  async ({ I, queryAnalyticsPage }) => {
    const url = new URL(await I.grabCurrentUrl());
    const fromString1 = url.searchParams.get('from');
    const toString1 = url.searchParams.get('to');

    I.wait(60);
    I.openNewTab();
    I.amOnPage(url.toString());
    queryAnalyticsPage.waitForLoaded();

    const url2 = new URL(await I.grabCurrentUrl());
    const fromString2 = url2.searchParams.get('from');
    const toString2 = url2.searchParams.get('to');

    assert.equal(fromString1, fromString2, `The time range "from" ${fromString1} is NOT the same you were seeing in previously tab ${fromString2}`);
    assert.equal(toString1, toString2, `The time range "to" ${toString1} is NOT the same you were seeing in previously tab ${toString2}`);
  },
);

// https://perconadev.atlassian.net/browse/PMM-13052 blocked
Scenario.skip(
  'PMM-T1141 - Verify specific time range by new button to copy QAN URL @qan',
  async ({ I, adminPage }) => {
    const dateTime = moment();
    const to = dateTime.format('YYYY-MM-DD HH:mm:ss');
    const from = moment(dateTime).subtract(1, 'hours').format('YYYY-MM-DD HH:mm:ss');
    const fromToString = `&from=${moment(from).valueOf()}&to=${moment(to).valueOf()}`;

    await adminPage.setAbsoluteTimeRange(from, to);
    // await anOverview.waitForOverviewLoaded();
    await I.seeInCurrentUrl(fromToString);
    // await I.click(anOverview.buttons.copyButton);

    // const url = await I.grabTextFrom(anOverview.elements.clipboardLink);

    await I.openNewTab();
    // await I.amOnPage(url.match(/\bhttps?:\/\/\S+/gi)[0]);
    await I.seeInCurrentUrl(fromToString);
  },
);

Scenario(
  'PMM-T1142 - Verify that the table page and selected query are still the same when we go on copied link by new QAN CopyButton @qan',
  async ({
    I, queryAnalyticsPage,
  }) => {
    await I.waitForVisible(queryAnalyticsPage.data.buttons.nextPage);
    await I.click(queryAnalyticsPage.data.buttons.nextPage);
    await queryAnalyticsPage.data.selectRow(2);
    await I.click(queryAnalyticsPage.buttons.copyButton);
    await I.waitForVisible(I.getPopUpLocator(), 10);

    const url = await I.grabTextFrom(queryAnalyticsPage.elements.clipboardLink);

    await I.openNewTab({ viewport: { width: 1920, height: 1080 } });
    await I.amOnPage(url);

    await I.assertContain(url, '&page_number=2', 'Expected the Url to contain selected page');
    await queryAnalyticsPage.waitForLoaded();
    await queryAnalyticsPage.data.verifyActivePage(2);
    await I.waitForVisible(queryAnalyticsPage.data.elements.selectedRowByNumber(2), 20);
    await I.waitForElement(queryAnalyticsPage.data.buttons.close, 30);
  },
);

Scenario(
  'PMM-T1143 - Verify columns and filters when we go on copied link by new QAN CopyButton @qan',
  async ({
    I, queryAnalyticsPage,
  }) => {
    const environmentName = 'pxc-dev';
    const columnName = 'Bytes Sent';

    queryAnalyticsPage.addColumn(columnName);
    queryAnalyticsPage.filters.selectFilter(environmentName);
    queryAnalyticsPage.waitForLoaded();
    I.click(queryAnalyticsPage.buttons.copyButton);
    I.waitForVisible(I.getPopUpLocator(), 10);

    const url = await I.grabTextFrom(queryAnalyticsPage.elements.clipboardLink);

    I.openNewTab();
    I.amOnPage(url);
    queryAnalyticsPage.waitForLoaded();
    I.seeInCurrentUrl(`environment=${environmentName}`);
    await queryAnalyticsPage.filters.verifyCheckedFilters([environmentName]);
    I.waitForElement(queryAnalyticsPage.data.fields.columnHeader(columnName), 30);
  },
);
