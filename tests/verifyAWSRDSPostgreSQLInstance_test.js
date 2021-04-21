const assert = require('assert');

Feature('Monitoring AWS RDS MySQL DB');

Before(async ({ I }) => {
  I.Authorize();
});

Scenario(
  'PMM-T716 - Verify adding PostgreSQL RDS monitoring to PMM via UI @not-pr-pipeline',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, qanPage, qanFilters, qanOverview, dashboardPage,
  }) => {
    const serviceName = 'pmm-qa-postgres-12';

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded().openAddAWSRDSMySQLPage();
    remoteInstancesPage.discoverRDS();
    remoteInstancesPage.verifyInstanceIsDiscovered(serviceName);
    remoteInstancesPage.startMonitoringOfInstance(serviceName);
    remoteInstancesPage.verifyAddInstancePageOpened();
    const grabbedHostname = await I.grabValueFrom(remoteInstancesPage.fields.hostName);

    assert.ok(grabbedHostname.startsWith(serviceName), `Hostname is incorrect: ${grabbedHostname}`);
    I.seeInField(remoteInstancesPage.fields.serviceName, serviceName);
    remoteInstancesPage.fillRemoteRDSFields(serviceName);
    remoteInstancesPage.createRemoteInstance(serviceName);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(serviceName);
    await pmmInventoryPage.verifyAgentHasStatusRunning(serviceName);
    await pmmInventoryPage.verifyMetricsFlags(serviceName);

    I.amOnPage(dashboardPage.postgresqlInstanceOverviewDashboard.url);
    dashboardPage.applyFilter('Node Name', serviceName);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData();
    // Wait until data in QAN with slowlog will be.
    I.wait(30);
    I.amOnPage(qanPage.url);
    qanOverview.waitForOverviewLoaded();
    qanFilters.applyFilter('RDS Postgres');
    qanOverview.waitForOverviewLoaded();
    const count = await qanOverview.getCountOfItems();

    assert.ok(count > 0, 'The queries for added RDS Postgres do NOT exist');
  },
);
