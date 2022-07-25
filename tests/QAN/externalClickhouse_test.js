const assert = require('assert');

Feature('External Clickhouse Tests');

// Address of PMM with external clickhouse created with docker compose.
const basePmmUrl = 'http://127.0.0.1:8080/';

BeforeSuite(async ({ I }) => {
  await I.verifyCommand('docker-compose -f docker-compose-clickhouse.yml up -d');
  await I.verifyCommand('docker exec pmm-client sh -c "pmm-admin add mysql --username=root --password=pass --query-source=perfschema  mysql5.7 mysql5.7:3306"');
  await I.wait(60);
});

Before(async ({ I }) => {
  await I.Authorize('admin', 'admin');
});

AfterSuite(async ({ I }) => {
  await I.verifyCommand('docker-compose -f docker-compose-clickhouse.yml down -v');
});

// Tag only for adding into matrix job, to be fixed later.
Scenario(
  'PMM-T1218 Verify PMM with external Clickhouse @docker-configuration',
  async ({ I, dataSourcePage, qanPage }) => {
    await I.amOnPage(basePmmUrl + dataSourcePage.url);
    await I.waitForVisible(dataSourcePage.elements.clickHouseDescription);
    const clickHouseAddress = await I.grabTextFrom(dataSourcePage.elements.clickHouseDescription);

    assert.ok(clickHouseAddress.includes('external-clickhouse:8123'), 'PMM is not using correct clickhouse address');
    await I.amOnPage(basePmmUrl + qanPage.clearUrl);
    await qanPage.waitForOpened();
    I.dontSeeElement(qanPage.elements.noQueryAvailable);
    await I.waitForVisible(qanPage.elements.qanRow);
    const qanRows = await I.grabNumberOfVisibleElements(qanPage.elements.qanRow);

    assert.ok(qanRows > 0, 'Query Analytics are empty');

    I.click(locate('span').withText('mysql5.7'));
    await I.waitForVisible(qanPage.elements.qanRow);
    const mysqlRows = await I.grabNumberOfVisibleElements(qanPage.elements.qanRow);

    assert.ok(mysqlRows > 0, 'Query Analytics are empty for mysql database');
  },
);
