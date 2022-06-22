const assert = require('assert');

Feature('External Clickhouse Tests');

BeforeSuite(async ({ I }) => {
  await I.verifyCommand('docker-compose -f docker-compose-clickhouse.yml up -d');
  await I.wait(20);
});

Before(async ({ I }) => {
  await I.Authorize();
});

AfterSuite(async ({ I }) => {
  I.say(await I.verifyCommand('docker ps -a'));
  await I.verifyCommand('docker-compose -f docker-compose-clickhouse.yml down -v');
});

Scenario(
  'PMM-T1218 Verify PMM with external Clickhouse @externalClickhouse',
  async ({ I, dataSourcePage }) => {
    await I.amOnPage(`http://127.0.0.1:8081/${dataSourcePage.url}`);
    await I.waitForVisible(dataSourcePage.elements.clickHouseDescription);
    const clickHouseAddress = await I.grabTextFrom(dataSourcePage.elements.clickHouseDescription);

    assert.ok(clickHouseAddress.includes('http://127.0.0.1:9009'), 'PMM is not using correcet clickhouse address');
  },
);
