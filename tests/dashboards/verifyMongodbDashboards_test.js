Feature('Test Dashboards inside the MongoDB Folder');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T305 Open the MongoDB Instance Summary Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, dashboardPage }) => {
    I.amOnPage(dashboardPage.mongodbOverviewDashboard.url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyMetricsExistence(dashboardPage.mongodbOverviewDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData();
  },
);

Scenario(
  'Open the MongoDB Cluster Summary Dashboard and verify Metrics are present and graphs are displayed @nightly @dashboards',
  async ({ I, adminPage, dashboardPage }) => {
    I.amOnPage(dashboardPage.mongoDbClusterSummaryDashboard.url);
    dashboardPage.waitForDashboardOpened();
    I.click(adminPage.fields.metricTitle);
    adminPage.performPageDown(1);
    await dashboardPage.expandEachDashboardRow();
    dashboardPage.verifyMetricsExistence(dashboardPage.mongoDbClusterSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(12);
  },
);

Scenario(
  'PMM-T1698 Verify that Disk I/O and Swap Activity and Network Traffic panels have graphs if Node name contains dot symbol @nightly @dashboards',
  async ({ I, dashboardPage }) => {
    I.amOnPage(dashboardPage.mongodbReplicaSetSummaryDashboard.url);
    dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyMetricsExistence(dashboardPage.mongodbReplicaSetSummaryDashboard.metrics);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData();
  },
);

Scenario('PMM-T1889 Verify Mongo replication lag graph shows correct info @nightly @dashboards', async ({ I, dashboardPage }) => {
  const testConfigFile = 'c = rs.conf(); c.members[2].secondaryDelaySecs = 10; c.members[2].priority = 0; c.members[2].hidden = true; rs.reconfig(c);';

  await I.verifyCommand(`sudo docker exec rs101 mongo "mongodb://root:root@localhost/?replicaSet=rs" --eval "${testConfigFile}"`);
  I.amOnPage(dashboardPage.mongodbReplicaSetSummaryDashboard.cleanUrl);
  dashboardPage.waitForDashboardOpened();
  const [min, max, avg] = await dashboardPage.getReplicationLagValues('rs103');

  I.assertTrue(min >= 10, `Replication Lag min is less than expected lag value, expected: "10s" actual: ${min}`);
  I.assertTrue(max >= 10, `Replication Lag max is less than expected lag value, expected: "10s" actual: ${max}`);
  I.assertTrue(avg >= 10, `Replication Lag avg is less than expected lag value, expected: "10s" actual: ${avg}`);
  I.dontSee(dashboardPage.mongodbReplicaSetSummaryDashboard.elements.replicationLagMin('rs101'));
  I.dontSee(dashboardPage.mongodbReplicaSetSummaryDashboard.elements.replicationLagMin('rs102'));
});
