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
  'PMM-T432 Open the QAN Dashboard and check that changing absolute time range updates the overview table, URL. @nightly @qan',
  async ({ I, adminPage, qanDetails, qanFilters, qanOverview }) => {
    const date = moment().format('YYYY-MM-DD');
    const fromString = Date.parse(`${date} 00:00:00`);
    const toString = Date.parse(`${date} 23:59:59`);

    I.seeInCurrentUrl('from=now-5m&to=now');
    qanOverview.selectRow(1);
    qanFilters.waitForFiltersToLoad();
    I.seeElement(qanDetails.root);
    adminPage.setAbsoluteTimeRange(`${date} 00:00:00`, `${date} 23:59:59`);
    I.seeInCurrentUrl(`from=${fromString}&to=${toString}`);
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

Scenario(
  'PMM-T1138 - Verify QAN Copy Button for URL @qan',
  async ({ I, adminPage, qanOverview }) => {
    adminPage.applyTimeRange('Last 12 hours');

    const dateTime = moment();
    const fromToString = qanOverview.createFromToTimeString(dateTime, 12, 'hours');

    I.wait(300);
    qanOverview.waitForOverviewLoaded();
    qanOverview.selectRow(2);
    I.click(qanOverview.buttons.copyButton);

    const url = window.clipboardData.getData('Text');
    // const url = Clipboard.getText();
    // const url = await I.grabCurrentUrl();
    // const url = await navigator.clipboard.readText();

    // I.verifyPopUpMessage(qanOverview.messages.copiedPopUpMessage);
    I.openNewTab();
    I.amOnPage(url);
    qanOverview.waitForOverviewLoaded();
    I.waitForVisible(qanOverview.getSelectedRowLocator(2));
    I.seeInCurrentUrl(fromToString);
  },
);

Scenario(
  'PMM-T1140 - Verify relative time range copy URL from browser @qan',
  async ({ I, adminPage, qanOverview }) => {
    adminPage.applyTimeRange('Last 12 hours');

    const dateTime = moment();
    const fromToString = qanOverview.createFromToTimeString(dateTime, 12, 'hours');

    I.seeInCurrentUrl(fromToString);
    I.wait(300);

    const url = await I.grabCurrentUrl();

    I.openNewTab();
    I.amOnPage(url);

    const dateTime2 = moment();
    const fromToString2 = qanOverview.createFromToTimeString(dateTime2, 12, 'hours');

    I.seeInCurrentUrl(fromToString2);
    assert.notEqual(fromToString, fromToString2, 'The time range is NOT the same you were seeing in previously tab');
  },
);

Scenario(
  'PMM-T1141 - Verify specific time range by new button to copy QAN URL @qan',
  async ({ I, adminPage }) => {
    const date = moment().format('YYYY-MM-DD');
    const fromString = Date.parse(`${date} 00:00:00`);
    const toString = Date.parse(`${date} 23:59:59`);
    const fromToString = `from=${fromString}&to=${toString}`;

    adminPage.setAbsoluteTimeRange(`${date} 00:00:00`, `${date} 23:59:59`);
    I.seeInCurrentUrl(fromToString);

    const url = await I.grabCurrentUrl();

    I.openNewTab();
    I.amOnPage(url);
    I.seeInCurrentUrl(fromToString);
  },
);

Scenario(
  'PMM-T1142 - Verify that the table page and selected query are still the same when we go on copied link by new QAN CopyButton @qan',
  async ({ I, qanPagination, qanOverview }) => {
    I.click(qanPagination.buttons.nextPage);
    qanOverview.selectRow(2);
    I.click(qanOverview.buttons.copyButton);

    const url = await I.grabCurrentUrl();
    // const url = window.clipboardData.getData('Text');
    // const url = Clipboard.getText();

    I.openNewTab();
    I.amOnPage(url);
    qanOverview.waitForOverviewLoaded();
    // this check will need to be uncommented after tasks 9480 and 9481 are ready
    // qanPagination.verifyActivePage(2);
    I.waitForVisible(qanOverview.getSelectedRowLocator(2));
  },
);

Scenario(
  'PMM-T1143 - Verify columns and filters  when we go on copied link by new QAN CopyButton @qan',
  async ({ I, qanFilters, qanOverview }) => {
    const environmentName = 'ps-dev';
    const columnName = 'Bytes Sent';

    I.click(qanOverview.buttons.addColumn);
    qanOverview.addSpecificColumn(columnName);
    qanFilters.applyFilter(environmentName);
    qanOverview.waitForOverviewLoaded();
    I.click(qanOverview.buttons.copyButton);

    const url = await I.grabCurrentUrl();
    // const url = window.clipboardData.getData('Text');
    // const url = Clipboard.getText();

    I.openNewTab();
    I.amOnPage(url);
    qanOverview.waitForOverviewLoaded();
    I.seeInCurrentUrl(`environment=${environmentName}`);
    await qanFilters.verifyCountOfFilterLinks(1, false);
    I.waitForElement(qanOverview.getColumnLocator(columnName), 30);
  },
);
