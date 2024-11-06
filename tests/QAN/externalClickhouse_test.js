const assert = require('assert');

Feature('External Clickhouse Tests');

// Address of PMM with external clickhouse created with docker compose.
const pmmServerPort = '8081';
const basePmmUrl = `http://127.0.0.1:${pmmServerPort}/`;
const dockerVersion = process.env.DOCKER_VERSION || 'perconalab/pmm-server:3-dev-latest';

BeforeSuite(async ({ I }) => {
  await I.verifyCommand(`PMM_SERVER_IMAGE=${dockerVersion} docker-compose -f docker-compose-clickhouse.yml up -d`);
  await I.wait(30);
  await I.verifyCommand('docker exec pmm-client-clickhouse pmm-admin add mysql --username=root --password=7B*53@lCdflR --query-source=perfschema ps8 ps8:3306');
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
  async ({ I, dataSourcePage, queryAnalyticsPage }) => {
    I.amOnPage(basePmmUrl + dataSourcePage.url);
    I.waitForVisible(dataSourcePage.elements.clickHouseDatasource, 5);
    I.click(dataSourcePage.elements.clickHouseDatasource);
    I.waitForVisible(dataSourcePage.fields.clickhouseServerAddress, 5);
    I.seeInField(dataSourcePage.fields.clickhouseServerAddress, 'external-clickhouse');
    I.seeInField(dataSourcePage.fields.clickhouseServerPort, '9000');

    I.amOnPage(I.buildUrlWithParams(`${basePmmUrl}${queryAnalyticsPage.url}`, { from: 'now-5m' }));
    queryAnalyticsPage.waitForLoaded();
    I.dontSeeElement(queryAnalyticsPage.data.elements.noResultTableText);
    await I.waitForVisible(queryAnalyticsPage.data.elements.queryRows);
    const qanRows = await I.grabNumberOfVisibleElements(queryAnalyticsPage.data.elements.queryRows);

    assert.ok(qanRows > 0, 'Query Analytics is empty');

    I.click(locate('span').withText('mysql5.7'));
    await I.waitForVisible(queryAnalyticsPage.data.elements.queryRows);
    const mysqlRows = await I.grabNumberOfVisibleElements(queryAnalyticsPage.data.elements.queryRows);

    assert.ok(mysqlRows > 0, 'Query Analytics are empty for mysql database');
  },
);
