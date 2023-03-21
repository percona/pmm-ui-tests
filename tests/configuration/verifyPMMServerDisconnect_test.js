const assert = require('assert');

Feature('External Clickhouse Tests');

// Address of PMM with external clickhouse created with docker compose.
const basePmmUrl = 'http://127.0.0.1:8180/';

BeforeSuite(async ({ I }) => {
  await I.verifyCommand('docker-compose -f docker-compose-disconnect.yml up -d');
  await I.verifyCommand('docker exec pmm-client-disconnect sh -c "pmm-admin add mysql --username=root --password=7B*53@lCdflR --query-source=perfschema mysql-disconnect-5.7 mysql-disconnect-5.7:3306"');
  await I.wait(80);
});

Before(async ({ I }) => {
  await I.Authorize('admin', 'admin');
});

AfterSuite(async ({ I }) => {
  await I.verifyCommand('docker-compose -f docker-compose-disconnect.yml down -v');
});

Scenario(
  '@PMM-T1442 Verify metrics are saved if PMM server was offline @cli',
  async ({ I, dashboardPage, qanPage }) => {
    const withCustomBaseUrl = (url) => `${basePmmUrl}${url}`;

    await I.amOnPage(withCustomBaseUrl(dashboardPage.mySQLInstanceOverview.url));
    I.wait(5);
    I.dontSeeElement(dashboardPage.fields.metricPanelNa('Services panel'));
    await I.verifyCommand('docker-compose -f docker-compose-disconnect.yml up -d');
    await I.verifyCommand('docker stop pmm-server-disconnect');
    I.wait(180);
    await I.verifyCommand('docker start pmm-server-disconnect');
    I.wait(60);
    await I.amOnPage(withCustomBaseUrl(`${dashboardPage.mySQLInstanceOverview.clearUrl}?orgId=1&from=now-2m&to=now-1m`));
    I.dontSeeElement(dashboardPage.fields.metricPanelNa('Services panel'));
  },
);

xScenario(
  '@PMM-T1443 Verify metrics are saved if pmm-agent is stopped',
  async ({ I, dashboardPage, qanPage }) => {
    const withCustomBaseUrl = (url) => `${basePmmUrl}${url}`;

    await I.amOnPage(withCustomBaseUrl(dashboardPage.mySQLInstanceOverview.url));
    I.wait(5);
    I.dontSeeElement(dashboardPage.fields.metricPanelNa('Services panel'));
    await I.verifyCommand('docker-compose -f docker-compose-disconnect.yml up -d');
    // todo: find a way to put pmm-agent offline without collateralAd
    I.wait(60);
    await I.amOnPage(withCustomBaseUrl(`${dashboardPage.mySQLInstanceOverview.clearUrl}?orgId=1&from=now-2m&to=now-1m`));
    I.dontSeeElement(dashboardPage.fields.metricPanelNa('Services panel'));
    I.wait(1000);
  },
);
