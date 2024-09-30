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
    qanPagination.selectPage(2);
    await adminPage.applyTimeRange('Last 3 hours');
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

    await adminPage.applyTimeRange('Last 3 hours');
    qanOverview.waitForOverviewLoaded();
    I.seeInCurrentUrl('from=now-3h&to=now');
    I.dontSeeElement(qanDetails.root);
    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    I.seeElement(qanDetails.root);
  },
);

Scenario(
  'PMM-T432 Open the QAN Dashboard and check that changing absolute time range updates the overview table, URL. @nightly @qan',
  async ({
    I, adminPage, qanFilters, qanOverview,
  }) => {
    const currentDate = moment();
    const dateString = currentDate.format('YYYY-MM-DD');

    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    adminPage.setAbsoluteTimeRange(`${dateString} 00:00:00`, `${dateString} 23:59:59`);
    const url = await I.grabCurrentUrl();

    adminPage.verifySelectedTimeRange(`${dateString} 00:00:00`, `${dateString} 23:59:59`);

    I.assertContain(url.split('from=')[1].replaceAll('%20', ' '), `${currentDate.format('ddd MMM DD YYYY')} 00:00:00`, 'From Date is not correct');
    I.assertContain(url.split('to=')[1].replaceAll('%20', ' '), `${currentDate.format('ddd MMM DD YYYY')} 23:59:59`, 'To Date is not correct');
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

Scenario(
  'PMM-T1138 - Verify QAN Copy Button for URL @qan',
  async ({ I, adminPage, qanOverview }) => {
    await adminPage.applyTimeRange('Last 12 hours');

    qanOverview.waitForOverviewLoaded();
    qanOverview.selectRow(2);
    I.click(qanOverview.buttons.copyButton);
    I.waitForVisible(I.getPopUpLocator(), 10);

    const url = new URL(await I.grabTextFrom(qanOverview.elements.clipboardLink));
    const toTimeFromUrl1 = url.searchParams.get('to');

    assert.ok(Math.abs(moment().format('x') - toTimeFromUrl1) < 30000000, 'Difference between moment time and first copied time must be less then half of minute');

    I.wait(30);
    I.refreshPage();
    qanOverview.waitForOverviewLoaded();
    I.click(qanOverview.buttons.copyButton);
    I.waitForVisible(I.getPopUpLocator(), 10);

    const url2 = new URL(await I.grabTextFrom(qanOverview.elements.clipboardLink));
    const toTimeFromUrl2 = url2.searchParams.get('to');

    assert.ok(Math.abs(toTimeFromUrl1 - toTimeFromUrl2) < 120000, 'Difference between moment time and second copied time must be less then two minute');
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

    adminPage.setAbsoluteTimeRange(from, to);
    qanOverview.waitForOverviewLoaded();

    const url = await I.grabCurrentUrl();

    I.assertContain(url.split('from=')[1].replaceAll('%20', ' '), moment(from).format('ddd MMM DD YYYY HH:mm:ss'), 'Url does not contain selected from date time');
    I.assertContain(url.split('to=')[1].replaceAll('%20', ' '), moment(to).format('ddd MMM DD YYYY HH:mm:ss'), 'Url does not contain selected to date time');

    I.click(qanOverview.buttons.copyButton);
    const clipBoardUrl = await I.grabTextFrom(qanOverview.elements.clipboardLink);

    I.amOnPage(clipBoardUrl);
    qanOverview.waitForOverviewLoaded();
    const secondUrl = await I.grabCurrentUrl();

    adminPage.verifySelectedTimeRange(from, to);

    I.assertContain(secondUrl.split('from=')[1].replaceAll('%20', ' '), moment(from).utc().format('ddd MMM DD YYYY HH:mm:ss'), 'Second Url does not contain selected from date time');
    I.assertContain(secondUrl.split('to=')[1].replaceAll('%20', ' '), moment(to).utc().format('ddd MMM DD YYYY HH:mm:ss'), 'Second Url does not contain selected to date time');
  },
);

Scenario(
  'PMM-T1142 - Verify that the table page and selected query are still the same when we go on copied link by new QAN CopyButton @qan',
  async ({
    I, qanPagination, qanOverview, qanDetails,
  }) => {
    I.click(qanPagination.buttons.nextPage);
    qanOverview.selectRow(2);
    I.click(qanOverview.buttons.copyButton);
    I.waitForVisible(I.getPopUpLocator(), 10);

    const url = await I.grabTextFrom(qanOverview.elements.clipboardLink);

    I.openNewTab();
    I.amOnPage(url);
    qanOverview.waitForOverviewLoaded();
    // this check will need to be uncommented after tasks 9480 and 9481 are ready
    // qanPagination.verifyActivePage(2);
    I.waitForVisible(qanOverview.getSelectedRowLocator(2), 20);
    I.waitForElement(qanDetails.buttons.close, 30);
  },
);

Scenario(
  'PMM-T1143 - Verify columns and filters when we go on copied link by new QAN CopyButton @qan',
  async ({ I, qanFilters, qanOverview }) => {
    const environmentName = 'ps-dev';
    const columnName = 'Bytes Sent';

    qanOverview.addSpecificColumn(columnName);
    await qanFilters.applyFilter(environmentName);
    qanOverview.waitForOverviewLoaded();
    I.click(qanOverview.buttons.copyButton);
    I.waitForVisible(I.getPopUpLocator(), 10);

    const url = await I.grabTextFrom(qanOverview.elements.clipboardLink);

    I.openNewTab();
    I.amOnPage(url);
    qanOverview.waitForOverviewLoaded();
    I.seeInCurrentUrl(`environment=${environmentName}`);
    await qanFilters.verifyCountOfFilterLinks(1, false);
    I.waitForElement(qanOverview.getColumnLocator(columnName), 30);
  },
);

