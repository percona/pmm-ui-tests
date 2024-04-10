const moment = require('moment');
const assert = require('assert');

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
    await qanPagination.selectPage(2);
    await adminPage.applyTimeRange('Last 3 hours');
    await qanOverview.waitForOverviewLoaded();
    await qanPagination.verifyActivePage(1);
  },
);

Scenario(
  'PMM-T167 Open the QAN Dashboard and check that changing the time range updates the overview table, URL. @nightly @qan',
  async ({
    I, adminPage, qanDetails, qanFilters, qanOverview,
  }) => {
    await I.seeInCurrentUrl('from=now-5m&to=now');
    await qanOverview.selectRow(1);
    await qanFilters.waitForFiltersToLoad();
    await I.seeElement(qanDetails.root);

    await adminPage.applyTimeRange('Last 3 hours');
    await qanOverview.waitForOverviewLoaded();
    await I.seeInCurrentUrl('from=now-3h&to=now');
    await qanOverview.selectRow(1);
    await qanFilters.waitForFiltersToLoad();
    await I.seeElement(qanDetails.root);
  },
);

Scenario(
  'PMM-T432 Open the QAN Dashboard and check that changing absolute time range updates the overview table, URL. @nightly @qan',
  async ({
    I, adminPage, qanDetails, qanFilters, qanOverview,
  }) => {
    const date = moment().format('YYYY-MM-DD');
    const fromString = Date.parse(`${date} 00:00:00`);
    const toString = Date.parse(`${date} 23:59:59`);

    await I.seeInCurrentUrl('from=now-5m&to=now');
    await qanOverview.selectRow(1);
    await qanFilters.waitForFiltersToLoad();
    await I.seeElement(qanDetails.root);
    await adminPage.setAbsoluteTimeRange(`${date} 00:00:00`, `${date} 23:59:59`);
    await I.seeInCurrentUrl(`from=${fromString}&to=${toString}`);
    await qanOverview.selectRow(1);
    await qanFilters.waitForFiltersToLoad();
    await I.seeElement(qanDetails.root);
  },
);

Scenario(
  'PMM-T170 Open the QAN Dashboard and check that changing the time range doesn\'t clear "Group by". @qan',
  async ({ I, adminPage, qanOverview }) => {
    const group = 'Client Host';

    I.waitForText('Query', 30, qanOverview.elements.groupBy);
    await qanOverview.changeGroupBy(group);
    await adminPage.applyTimeRange('Last 24 hours');
    qanOverview.waitForOverviewLoaded();
    qanOverview.verifyGroupByIs(group);
  },
);

Scenario(
  'Open the QAN Dashboard and check that changing the time range doesn\'t reset sorting. @qan',
  async ({ adminPage, qanOverview }) => {
    await qanOverview.changeSorting(1);
    await adminPage.applyTimeRange('Last 24 hours');
    qanOverview.waitForOverviewLoaded();
    qanOverview.verifySorting(1, 'desc');
  },
);

Scenario.skip(
  'PMM-T1138 - Verify QAN Copy Button for URL @qan',
  async ({ I, adminPage, qanOverview }) => {
    await adminPage.applyTimeRange('Last 12 hours');

    const dateTime = moment().format('x');

    qanOverview.waitForOverviewLoaded();
    qanOverview.selectRow(2);
    I.click(qanOverview.buttons.copyButton);
    I.waitForVisible(I.getPopUpLocator(), 10);

    const url = new URL(await I.grabTextFrom(qanOverview.elements.clipboardLink));
    const toTimeFromUrl1 = url.searchParams.get('to');

    assert.ok(Math.abs(dateTime - toTimeFromUrl1) < 30000, 'Difference between moment time and first copied time must be less then half of minute');

    I.wait(30);
    I.refreshPage();
    qanOverview.waitForOverviewLoaded();
    I.click(qanOverview.buttons.copyButton);
    I.waitForVisible(I.getPopUpLocator(), 10);

    const url2 = new URL(await I.grabTextFrom(qanOverview.elements.clipboardLink));
    const toTimeFromUrl2 = url2.searchParams.get('to');

    assert.ok(Math.abs(toTimeFromUrl1 - toTimeFromUrl2) < 60000, 'Difference between moment time and second copied time must be less then one minute');
    assert.notEqual(toTimeFromUrl1, toTimeFromUrl2, 'TimeFromUrl2 must not be the same as timeFromUrl1');

    I.openNewTab();
    I.amOnPage(url.toString());
    qanOverview.waitForOverviewLoaded();
    I.waitForVisible(qanOverview.getSelectedRowLocator(2));
  },
);

Scenario(
  'PMM-T1140 - Verify relative time range copy URL from browser @qan',
  async ({ I, qanOverview }) => {
    const url = new URL(await I.grabCurrentUrl());
    const fromString1 = url.searchParams.get('from');
    const toString1 = url.searchParams.get('to');

    I.wait(60);
    I.openNewTab();
    I.amOnPage(url.toString());
    qanOverview.waitForOverviewLoaded();

    const url2 = new URL(await I.grabCurrentUrl());
    const fromString2 = url2.searchParams.get('from');
    const toString2 = url2.searchParams.get('to');

    assert.equal(fromString1, fromString2, `The time range "from" ${fromString1} is NOT the same you were seeing in previously tab ${fromString2}`);
    assert.equal(toString1, toString2, `The time range "to" ${toString1} is NOT the same you were seeing in previously tab ${toString2}`);
  },
);

Scenario(
  'PMM-T1141 - Verify specific time range by new button to copy QAN URL @qan',
  async ({ I, adminPage, qanOverview }) => {
    const dateTime = moment();
    const to = dateTime.format('YYYY-MM-DD HH:mm:ss');
    const from = moment(dateTime).subtract(1, 'hours').format('YYYY-MM-DD HH:mm:ss');
    const fromToString = `&from=${moment(from).valueOf()}&to=${moment(to).valueOf()}`;

    await adminPage.setAbsoluteTimeRange(from, to);
    await qanOverview.waitForOverviewLoaded();
    await I.seeInCurrentUrl(fromToString);
    await I.click(qanOverview.buttons.copyButton);

    const url = await I.grabTextFrom(qanOverview.elements.clipboardLink);

    await I.openNewTab();
    await I.amOnPage(url.match(/\bhttps?:\/\/\S+/gi)[0]);
    await I.seeInCurrentUrl(fromToString);
  },
);

Scenario(
  'PMM-T1142 - Verify that the table page and selected query are still the same when we go on copied link by new QAN CopyButton @qan',
  async ({
    I, qanPagination, qanOverview, qanDetails,
  }) => {
    await I.click(qanPagination.buttons.nextPage);
    await qanOverview.selectRow(2);
    await I.click(qanOverview.buttons.copyButton);
    await I.waitForVisible(I.getPopUpLocator(), 10);

    const url = await I.grabTextFrom(qanOverview.elements.clipboardLink);

    await I.openNewTab();
    await I.amOnPage(url.match(/\bhttps?:\/\/\S+/gi)[0]);

    await I.assertContain(url, '&page_number=2', 'Expected the Url to contain selected page');
    await qanOverview.waitForOverviewLoaded();
    // this check will need to be uncommented after tasks 9480 and 9481 are ready
    // qanPagination.verifyActivePage(2);
    await I.waitForVisible(qanOverview.getSelectedRowLocator(2), 20);
    await I.waitForElement(qanDetails.buttons.close, 30);
  },
);

Scenario(
  'PMM-T1143 - Verify columns and filters when we go on copied link by new QAN CopyButton @qan',
  async ({
    I, qanFilters, qanOverview, queryAnalyticsPage,
  }) => {
    const environmentName = 'ps-dev';
    const columnName = 'Bytes Sent';

    await queryAnalyticsPage.addColumn(columnName);
    await qanFilters.applyFilter(environmentName);
    await qanOverview.waitForOverviewLoaded();
    await I.click(qanOverview.buttons.copyButton);
    await I.waitForVisible(I.getPopUpLocator(), 10);

    const url = await I.grabTextFrom(qanOverview.elements.clipboardLink);

    await I.openNewTab();
    await I.amOnPage(url.match(/\bhttps?:\/\/\S+/gi)[0]);
    await queryAnalyticsPage.waitForLoaded();
    await I.seeInCurrentUrl(`environment=${environmentName}`);
    await queryAnalyticsPage.filters.verifyCheckedFilters([environmentName]);
    await I.waitForElement(qanOverview.getColumnLocator(columnName), 30);
  },
);
