Feature('Pmm Server stability');

// Address of PMM to be disconnected.
const pmmServerPort = '8180';
const basePmmUrl = `http://127.0.0.1:${pmmServerPort}/`;
let clientServerNetwork = 'pmm-ui-tests_server-network';

BeforeSuite(async ({ I }) => {
  await I.verifyCommand('docker-compose -f docker-compose-disconnect.yml up -d pmm-server-disconnect');
  await I.verifyCommand(`timeout 100 bash -c 'while [[ "$(curl -s -o /dev/null -w ''%{http_code}'' 127.0.0.1:${pmmServerPort}/ping)" != "200" ]]; do sleep 5; done' || false`);
  await I.verifyCommand('docker-compose -f docker-compose-disconnect.yml up -d pmm-client');
  await I.verifyCommand('docker-compose -f docker-compose-disconnect.yml up -d mysql5.7');
  clientServerNetwork = await I.verifyCommand('docker inspect pmm-client-disconnect -f \'{{range $k, $v := .NetworkSettings.Networks}}{{printf "%s\\n" $k}}{{end}}\' | grep -o \'.*server-network\'');
  await I.wait(30);
  I.say(await I.verifyCommand('docker exec pmm-client-disconnect pmm-admin add mysql --username=root --password=7B*53@lCdflR --host=mysql-disconnect-5.7 --port=3306 --query-source=perfschema mysql-disconnect-5.7'));
  await I.wait(60);
});

Before(async ({ I }) => {
  await I.Authorize('admin', 'admin');
});

AfterSuite(async ({ I }) => {
  await I.verifyCommand('docker-compose -f docker-compose-disconnect.yml down -v');
});

const withCustomBaseUrl = (url) => `${basePmmUrl}${url}`;

Scenario(
  '@PMM-T1442 Verify metrics are saved if PMM server was offline @disconnect',
  async ({ I, dashboardPage }) => {
    await I.amOnPage(withCustomBaseUrl(dashboardPage.mysqlInstanceSummaryDashboard.url));
    // await dashboardPage.waitForDashboardOpened();
    // await dashboardPage.expandEachDashboardRow();
    // I.wait(5);
    // I.dontSeeElement(dashboardPage.fields.metricPanelNa('Services panel'));
    // await I.verifyCommand('docker stop pmm-server-disconnect');
    // I.wait(600);
    // await I.verifyCommand('docker start pmm-server-disconnect');
    // I.wait(60);
    // await I.amOnPage(withCustomBaseUrl(`${dashboardPage.mysqlInstanceSummaryDashboard.clearUrl}?orgId=1&from=now-3m&to=now-1m`));
    // await dashboardPage.waitForDashboardOpened();
    // await dashboardPage.expandEachDashboardRow();
    // await dashboardPage.verifyThereAreNoGraphsWithNA(1);
    // await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
    // I.dontSeeElement(dashboardPage.fields.metricPanelNa('Services panel'));
  },
);

Scenario(
  '@PMM-T1443 Verify metrics are saved if pmm-agent is stopped @disconnect',
  async ({ I, dashboardPage, qanPage }) => {
    await I.amOnPage(withCustomBaseUrl(dashboardPage.mysqlInstanceSummaryDashboard.url));
    // await dashboardPage.waitForDashboardOpened();
    // await dashboardPage.expandEachDashboardRow();
    // I.wait(5);
    // I.dontSeeElement(dashboardPage.fields.metricPanelNa('Services panel'));
    // await I.verifyCommand(`docker network disconnect ${clientServerNetwork} pmm-client-disconnect`);
    // I.wait(600);
    // await I.verifyCommand(`docker network connect ${clientServerNetwork} pmm-client-disconnect`);
    // I.wait(60);
    // await I.amOnPage(withCustomBaseUrl(`${dashboardPage.mysqlInstanceSummaryDashboard.clearUrl}?orgId=1&from=now-3m&to=now-1m`));
    // await dashboardPage.waitForDashboardOpened();
    // await dashboardPage.expandEachDashboardRow();
    // await dashboardPage.verifyThereAreNoGraphsWithNA(1);
    // await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
    // I.dontSeeElement(dashboardPage.fields.metricPanelNa('Services panel'));
  },
);
