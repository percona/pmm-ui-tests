Feature('Pmm Server stability');

// Address of PMM to be disconnected.
const basePmmUrl = 'http://127.0.0.1:8180/';

BeforeSuite(async ({ I }) => {
  await I.verifyCommand('docker-compose -f docker-compose-disconnect.yml up -d pmm-server-disconnect');
  await I.verifyCommand('timeout 100 bash -c \'while [[ "$(curl -s -o /dev/null -w \'\'%{http_code}\'\' 127.0.0.1:8180/ping)" != "200" ]]; do sleep 5; done\' || false');
  await I.verifyCommand('docker-compose -f docker-compose-disconnect.yml up -d pmm-client');
  await I.verifyCommand('docker-compose -f docker-compose-disconnect.yml up -d mysql5.7');
  I.say(await I.verifyCommand('docker ps'));
  await I.wait(60);
  I.say(await I.verifyCommand('docker ps'));
  I.say(await I.verifyCommand('docker container logs pmm-client-disconnect'));
  I.say(await I.verifyCommand('docker exec pmm-client-disconnect pmm-admin add mysql --username=root --password=7B*53@lCdflR --host=mysql-disconnect-5.7 --port=3306 --query-source=perfschema mysql-disconnect-5.7'));
  await I.wait(80);
});

Before(async ({ I }) => {
  await I.Authorize();
});

AfterSuite(async ({ I }) => {
  await I.verifyCommand('docker-compose -f docker-compose-disconnect.yml down -v');
});

Scenario(
  '@PMM-T1442 Verify metrics are saved if PMM server was offline @cli',
  async ({ I, dashboardPage }) => {
    const withCustomBaseUrl = (url) => `${basePmmUrl}${url}`;

    await I.amOnPage(withCustomBaseUrl(dashboardPage.mysqlInstanceSummaryDashboard.url));
    await dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    I.wait(5);
    I.dontSeeElement(dashboardPage.fields.metricPanelNa('Services panel'));
    await I.verifyCommand('docker stop pmm-server-disconnect');
    I.wait(600);
    await I.verifyCommand('docker start pmm-server-disconnect');
    I.wait(60);
    await I.amOnPage(withCustomBaseUrl(`${dashboardPage.mysqlInstanceSummaryDashboard.clearUrl}?orgId=1&from=now-3m&to=now-1m`));
    await dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyThereAreNoGraphsWithNA(1);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
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
    await dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyThereAreNoGraphsWithNA(1);
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
    I.dontSeeElement(dashboardPage.fields.metricPanelNa('Services panel'));
  },
);
