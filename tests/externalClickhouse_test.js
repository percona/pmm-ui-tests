const assert = require('assert');

Feature('External Clickhouse Tests');

const basePmmUrl = 'http://127.0.0.1:8080/';

BeforeSuite(async ({ I }) => {
  await I.verifyCommand('docker-compose -f docker-compose-clickhouse.yml up -d');
  await I.wait(180);
});

Before(async ({ I }) => {
  await I.Authorize('admin', 'admin');
});

AfterSuite(async ({ I }) => {
  await I.verifyCommand('docker-compose -f docker-compose-clickhouse.yml down -v');
});

Scenario(
  'PMM-T1218 Verify PMM with external Clickhouse @externalClickhouse',
  async ({ I, dataSourcePage, qanPage }) => {
    await I.amOnPage(basePmmUrl + dataSourcePage.url);
    await I.waitForVisible(dataSourcePage.elements.clickHouseDescription);
    const clickHouseAddress = await I.grabTextFrom(dataSourcePage.elements.clickHouseDescription);

    assert.ok(clickHouseAddress.includes('external-clickhouse:9000'), 'PMM is not using correcet clickhouse address');
    I.amOnPage(basePmmUrl + qanPage.clearUrl);
    await qanPage.waitForOpened();
    I.dontSeeElement(qanPage.elements.noQueryAvailable);
    const qanRows = await I.grabNumberOfVisibleElements(locate('article').inside(qanPage.elements.qanRow));

    assert.ok(qanRows > 0, 'Query Analytics are empty');
  },
);
