const assert = require('assert');

Feature('External Clickhouse Tests');

// Address of PMM with external clickhouse created with docker compose.
const pmmServerPort = '8081';
const basePmmUrl = `http://127.0.0.1:${pmmServerPort}/`;
const dockerVersion = process.env.DOCKER_VERSION || 'perconalab/pmm-server:3-dev-latest';

BeforeSuite(async ({ I }) => {
  await I.verifyCommand(`PMM_SERVER_IMAGE=${dockerVersion} docker compose -f docker-compose-clickhouse.yml up -d`);
  await I.wait(30);
  await I.verifyCommand('docker exec pmm-client-clickhouse pmm-admin add mysql --username=root --password=7B*53@lCdflR --query-source=perfschema ps8 ps8:3306');
  await I.wait(60);
});

Before(async ({ I }) => {
  await I.Authorize('admin', 'admin', basePmmUrl);
});

AfterSuite(async ({ I }) => {
  await I.verifyCommand('docker compose -f docker-compose-clickhouse.yml down -v');
});

// Tag only for adding into matrix job, to be fixed later.
Scenario(
  'PMM-T1218 Verify PMM with external Clickhouse @docker-configuration @cli',
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

    I.click(locate('span').withText('ps8'));
    await I.waitForVisible(queryAnalyticsPage.data.elements.queryRows);
    const mysqlRows = await I.grabNumberOfVisibleElements(queryAnalyticsPage.data.elements.queryRows);

    assert.ok(mysqlRows > 0, 'Query Analytics are empty for mysql database');
  },
);

Scenario('PMM-T9999 - Verify external clickhouse as datasource on explore page @docker-configuration @cli', async ({ I, explorePage }) => {
  I.amOnPage(basePmmUrl + explorePage.url);
  explorePage.selectDataSource('ClickHouse');
  I.click(explorePage.elements.sqlEditorButton);
  I.clearField(explorePage.elements.sqlBuilder);
  I.fillField(explorePage.elements.sqlBuilder, 'SELECT * FROM pmm.metrics LIMIT 10;');
  I.click(explorePage.elements.runQueryButton);
  I.waitForVisible(explorePage.elements.resultRow, 10);
  I.dontSee(explorePage.messages.authError);
});

Scenario('PMM-T9999 - Verify internal clickhouse is not running @docker-configuration @cli', async ({ I, explorePage }) => {
  const response = await I.verifyCommand('docker exec pmm-server-external-clickhouse supervisorctl status', null, 'fail');

  I.assertFalse(response.includes('clickhouse'), 'Clickhouse should not run on pmm server!');
});
