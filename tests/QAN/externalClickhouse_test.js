const assert = require('assert');

Feature('External Clickhouse Tests');

// Address of PMM with external clickhouse created with docker compose.
const basePmmUrl = 'http://127.0.0.1:8080/';

BeforeSuite(async ({ I }) => {
  await I.verifyCommand('docker-compose -f docker-compose-clickhouse.yml up -d');
  await I.wait(60);
  await I.verifyCommand('docker exec pmm-client sh -c "pmm-admin add mysql --username=root --password=pass --query-source=perfschema  mysql5.7 mysql5.7:3306"');
});

Before(async ({ I }) => {
  await I.Authorize('admin', 'admin');
});

AfterSuite(async ({ I }) => {
  await I.verifyCommand('docker-compose -f docker-compose-clickhouse.yml down -v');
});

Scenario(
  'PMM-T1218 Verify PMM with external Clickhouse @qan',
  async ({ I, dataSourcePage, qanPage }) => {
    await I.amOnPage(basePmmUrl + dataSourcePage.url);
    await I.waitForVisible(dataSourcePage.elements.clickHouseDescription);
    const clickHouseAddress = await I.grabTextFrom(dataSourcePage.elements.clickHouseDescription);

    assert.ok(clickHouseAddress.includes('external-clickhouse:9000'), 'PMM is not using correct clickhouse address');
    await I.amOnPage(basePmmUrl + qanPage.clearUrl);
    await qanPage.waitForOpened();
    I.dontSeeElement(qanPage.elements.noQueryAvailable);
    await I.waitForVisible(qanPage.elements.qanRow);
    const qanRows = await I.grabNumberOfVisibleElements(qanPage.elements.qanRow);

    assert.ok(qanRows > 0, 'Query Analytics are empty');
  },
);
