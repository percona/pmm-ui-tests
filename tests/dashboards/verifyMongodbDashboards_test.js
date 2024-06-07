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

Scenario('PMM-T1889 Verify Mongo replication lag graph shows correct info @pmm-psmdb-replica-integration @not-ui-pipeline', async ({ I, dashboardPage }) => {
  const lagValue = 10;
  const testConfigFile = `c = rs.conf(); c.members[2].secondaryDelaySecs = ${lagValue}; c.members[2].priority = 0; c.members[2].hidden = true; rs.reconfig(c);`;

  await I.verifyCommand(`sudo docker exec rs101 mongo "mongodb://root:root@localhost/?replicaSet=rs" --eval "${testConfigFile}"`);
  I.amOnPage(I.buildUrlWithParams(dashboardPage.mongodbReplicaSetSummaryDashboard.cleanUrl, { from: 'now-5m' }));
  dashboardPage.waitForDashboardOpened();
  await dashboardPage.waitForMaxReplicationLagValuesAbove('rs103', lagValue, 90);
  const maxValue = await I.grabTextFrom(dashboardPage.mongodbReplicaSetSummaryDashboard.elements.replicationLagMax('rs103'));

  I.assertFalse(/min|hour|day|week|month|year/.test(maxValue), `Max replication value should be in seconds. Value is: ${maxValue}`);
});
