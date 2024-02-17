const assert = require('assert');

Feature('External Clickhouse Tests');

// Address of PMM with external clickhouse created with docker compose.
const pmmServerPort = '8081';
const basePmmUrl = `http://127.0.0.1:${pmmServerPort}/`;
const dockerVersion = process.env.DOCKER_VERSION || 'perconalab/pmm-server:dev-latest';

BeforeSuite(async ({ I }) => {
  await I.verifyCommand(`PMM_SERVER_IMAGE=${dockerVersion} docker-compose -f docker-compose-clickhouse.yml up -d`);
  await I.wait(30);
  await I.verifyCommand('docker exec pmm-client-clickhouse pmm-admin add mysql --username=root --password=7B*53@lCdflR --query-source=perfschema mysql5.7 mysql5.7:3306');
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
  '@PMM-T1218 Verify PMM with external Clickhouse @docker-configuration @cli',
  async ({ I, dataSourcePage, qanPage }) => {
    I.amOnPage(basePmmUrl + dataSourcePage.url);
    I.waitForVisible(dataSourcePage.elements.clickHouseDatasource, 5);
    I.click(dataSourcePage.elements.clickHouseDatasource);
    I.waitForVisible(dataSourcePage.fields.clickhouseServerAddress, 5);
    I.seeInField(dataSourcePage.fields.clickhouseServerAddress, 'external-clickhouse');
    I.seeInField(dataSourcePage.fields.clickhouseServerPort, '9000');

    await I.amOnPage(basePmmUrl + qanPage.clearUrl);
    await qanPage.waitForOpened();
    I.dontSeeElement(qanPage.elements.noQueryAvailable);
    await I.waitForVisible(qanPage.elements.qanRow);
    const qanRows = await I.grabNumberOfVisibleElements(qanPage.elements.qanRow);

    assert.ok(qanRows > 0, 'Query Analytics is empty');

    I.click(locate('span').withText('mysql5.7'));
    await I.waitForVisible(qanPage.elements.qanRow);
    const mysqlRows = await I.grabNumberOfVisibleElements(qanPage.elements.qanRow);

    assert.ok(mysqlRows > 0, 'Query Analytics are empty for mysql database');
  },
);
