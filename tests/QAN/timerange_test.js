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
    I, adminPage, qanDetails, qanFilters, qanOverview,
  }) => {
    const date = moment().format('YYYY-MM-DD');
    const fromString = Date.parse(`${date} 00:00:00`);
    const toString = Date.parse(`${date} 23:59:59`);
    const expectedFrom = new Date(fromString);
    const expectedTo = new Date(toString);

    I.seeInCurrentUrl('from=now-5m&to=now');
    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    I.seeElement(qanDetails.root);
    adminPage.setAbsoluteTimeRange(`${date} 00:00:00`, `${date} 23:59:59`);
    const u = new URL(await I.grabCurrentUrl());
    const actualFrom = new Date(Date.parse(u.searchParams.get('from')));
    const actualTo = new Date(Date.parse(u.searchParams.get('to')));

    assert.deepStrictEqual(actualFrom, expectedFrom);
    assert.deepStrictEqual(actualTo, expectedTo);
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

// TODO: unskip after https://jira.percona.com/browse/PMM-10589
Scenario.skip(
  'PMM-T1138 - Verify QAN Copy Button for URL @qan',
  async ({ I, adminPage, qanOverview }) => {
    await adminPage.applyTimeRange('Last 12 hours');

    const dateTime = new Date(Number(moment().format('x')));

    qanOverview.waitForOverviewLoaded();
    qanOverview.selectRow(2);
    qanOverview.waitForOverviewLoaded();

    I.click(qanOverview.buttons.copyButton);
    I.verifyPopUpMessage('Successfully copied Query Analytics link to clipboard');
    I.appendField(qanOverview.fields.searchBy, '');
    I.pressKey(['CommandOrControl', 'v']);

    const val = await I.grabValueFrom(qanOverview.fields.searchBy);

    const url1 = new URL(val);
    const toParamUrl1 = new Date(Number(url1.searchParams.get('to')));

    assert.ok((dateTime - toParamUrl1) < 30000, 'Difference between moment time and first copied time must be less than 30s');

    I.wait(30);
    I.refreshPage();
    qanOverview.waitForOverviewLoaded();
    I.click(qanOverview.buttons.copyButton);

    I.appendField(qanOverview.fields.searchBy, '');
    I.pressKey(['CommandOrControl', 'v']);

    const url2 = new URL(await I.grabValueFrom(qanOverview.fields.searchBy));

    const toParamUrl2 = url2.searchParams.get('to');

    assert.ok((toParamUrl1 - toParamUrl2) < 60000, 'Difference between moment time and second copied time must be less than 60s');
    assert.notStrictEqual(toParamUrl1, toParamUrl2, 'TimeFromUrl2 must not be the same as timeFromUrl1');

    I.amOnPage(url1.toString());
    qanOverview.waitForOverviewLoaded();
    I.waitForVisible(qanOverview.getSelectedRowLocator(2), 20);
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
  async ({
    I, adminPage, qanOverview,
  }) => {
    const dateTime = moment();
    const to = dateTime.format('YYYY-MM-DD HH:mm:ss');
    const from = moment(dateTime).subtract(1, 'hours').format('YYYY-MM-DD HH:mm:ss');

    adminPage.setAbsoluteTimeRange(from, to);
    qanOverview.waitForOverviewLoaded();

    const prevURL = new URL(await I.grabCurrentUrl());
    const expectedFrom = new Date(Date.parse(prevURL.searchParams.get('from')));
    const expectedTo = new Date(Date.parse(prevURL.searchParams.get('to')));

    I.click(qanOverview.buttons.copyButton);
    I.appendField(qanOverview.fields.searchBy, '');
    I.pressKey(['CommandOrControl', 'v']);

    const copiedURL = await I.grabValueFrom(qanOverview.fields.searchBy);

    const u = new URL(copiedURL);
    const actualFrom = new Date(Number(u.searchParams.get('from')));
    const actualTo = new Date(Number(u.searchParams.get('to')));

    I.amOnPage(copiedURL);
    qanOverview.waitForOverviewLoaded();

    const finalURL = new URL(await I.grabCurrentUrl());

    assert.deepStrictEqual(prevURL, finalURL, 'Expected final URL to be equal to starting one');
    assert.deepStrictEqual(actualFrom, expectedFrom, 'Expected "from" params to match');
    assert.deepStrictEqual(actualTo, expectedTo, 'Expected "to" params to match');
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

    I.click(qanOverview.buttons.addColumn);
    qanOverview.addSpecificColumn(columnName);
    qanFilters.applyFilter(environmentName);
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
