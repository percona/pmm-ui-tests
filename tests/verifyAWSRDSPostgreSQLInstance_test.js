const assert = require('assert');

Feature('Monitoring AWS RDS PostgreSQL');

Before(async ({ I }) => {
  await I.Authorize();
});

After(async ({ settingsAPI }) => {
  if (process.env.OVF_TEST === 'yes') {
    const body = {
      metrics_resolutions: {
        hr: '5s',
        mr: '10s',
        lr: '60s',
      },
    };

    await settingsAPI.changeSettings(body, true);
  }
});

Scenario(
  '@PMM-T716 - Verify adding PostgreSQL RDS monitoring to PMM via UI @aws @instances',
  async ({
    I, remoteInstancesPage, pmmInventoryPage,
  }) => {
    const serviceName = 'pmm-qa-pgsql-12';

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
    // Skipping due to QAN Setup part on AWS
    // await pmmInventoryPage.verifyAgentHasStatusRunning(serviceName);
    await pmmInventoryPage.verifyMetricsFlags(serviceName);
    const logs = await I.verifyCommand('docker exec pmm-server tail -n 100 /srv/logs/pmm-agent.log');

    I.say('Logs are:');
    I.say(`Logs does not contain rsadmin: ${!logs.includes('rdsadmin')}`);
    I.say(`Logs does not contain ERRO: ${!logs.includes('ERRO')}`);
    I.say(`Logs does not contains both: ${!logs.includes('rdsadmin') && !logs.includes('ERRO')}`);
    I.say(logs);

    assert.ok((!logs.includes('rdsadmin') && !logs.includes('ERRO')), 'Logs contains errors about rdsadmin database being used!');
  },
);

Scenario(
  'PMM-T716 - Verify Dashboard for Postgres RDS added via UI @aws @instances',
  async ({
    I, dashboardPage, settingsAPI,
  }) => {
    const serviceName = 'pmm-qa-pgsql-12';

    // Increase resolution to avoid failures for OVF execution
    if (process.env.OVF_TEST === 'yes') {
      const body = {
        metrics_resolutions: {
          hr: '60s',
          mr: '180s',
          lr: '300s',
        },
      };

      await settingsAPI.changeSettings(body, true);
    }

    // Wait 10 seconds before test to start getting metrics
    I.wait(10);
    I.amOnPage(dashboardPage.postgresqlInstanceOverviewDashboard.url);
    await dashboardPage.applyFilter('Node Name', serviceName);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData();
  },
).retry(2);

// Skip due to PGSQL instance setup on AWS
xScenario(
  'PMM-T716 - Verify QAN for Postgres RDS added via UI @aws @instances',
  async ({
    I, qanOverview, qanFilters, qanPage,
  }) => {
    I.amOnPage(qanPage.url);
    qanOverview.waitForOverviewLoaded();
    await qanFilters.applyFilter('RDS Postgres');
    qanOverview.waitForOverviewLoaded();
    const count = await qanOverview.getCountOfItems();

    assert.ok(count > 0, 'The queries for added RDS Postgres do NOT exist');
  },
).retry(2);
