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
  'PMM-T1831 Verify adding PostgreSQL RDS with specified Auto-discovery limit @aws @instances',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, inventoryAPI, agentsPage,
  }) => {
    const serviceName = 'pmm-qa-pgsql-12';

    await inventoryAPI.deleteNodeByServiceName('POSTGRESQL_SERVICE', serviceName);

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded().openAddAWSRDSMySQLPage();
    remoteInstancesPage.discoverRDS();
    remoteInstancesPage.startMonitoringOfInstance(serviceName);
    remoteInstancesPage.verifyAddInstancePageOpened();
    I.seeInField(remoteInstancesPage.fields.serviceName, serviceName);
    remoteInstancesPage.fillRemoteRDSFields(serviceName);
    I.click(remoteInstancesPage.fields.customAutoDiscoveryButton);
    I.clearField(remoteInstancesPage.fields.customAutoDiscoveryfield);
    I.fillField(remoteInstancesPage.fields.customAutoDiscoveryfield, '1');

    remoteInstancesPage.createRemoteInstance(serviceName);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(serviceName);

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('POSTGRESQL_SERVICE', serviceName);

    await agentsPage.open(service_id);
    await agentsPage.verifyAgentOtherDetailsSection('Postgres exporter', 'auto_discovery_limit=1');

    const agentId = await I.grabTextFrom(agentsPage.fields.agentIdByAgentName('Postgres exporter'));

    I.wait(3);

    const out = await I.verifyCommand(`docker top pmm-server | awk '/postgres_exporter/ && /${agentId.split('/')[2]}/'`);

    assert(!out.includes('--auto-discover-databases'), 'postgres-exporter should not have flag "auto-discover-databases"');
  },
);

Scenario(
  '@PMM-T716 - Verify adding PostgreSQL RDS monitoring to PMM via UI @aws @instances'
  + '@PMM-T1596 Verify that PostgreSQL exporter ignores connection error to "rdsadmin" database for Amazon RDS instance @aws @instances',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, inventoryAPI,
  }) => {
    const serviceName = 'pmm-qa-pgsql-12';

    await inventoryAPI.deleteNodeByServiceName('POSTGRESQL_SERVICE', serviceName);

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded().openAddAWSRDSMySQLPage();
    remoteInstancesPage.discoverRDS();
    await remoteInstancesPage.verifyInstanceIsDiscovered(serviceName);
    remoteInstancesPage.startMonitoringOfInstance(serviceName);
    remoteInstancesPage.verifyAddInstancePageOpened();
    const grabbedHostname = await I.grabValueFrom(remoteInstancesPage.fields.hostName);

    assert.ok(grabbedHostname.startsWith(serviceName), `Hostname is incorrect: ${grabbedHostname}`);
    I.seeInField(remoteInstancesPage.fields.serviceName, serviceName);
    await remoteInstancesPage.fillRemoteRDSFields(serviceName);
    remoteInstancesPage.createRemoteInstance(serviceName);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(serviceName);
    // Skipping due to QAN Setup part on AWS
    // await pmmInventoryPage.verifyAgentHasStatusRunning(serviceName);

    // await pmmInventoryPage.verifyMetricsFlags(serviceName);
    const logs = await I.verifyCommand('docker exec pmm-server cat /srv/logs/pmm-agent.log | awk \'/postgres_exporter/ && /ERRO/ && /opening connection/ && /rdsadmin/\'');

    assert.ok(!logs, `Logs contains errors about rdsadmin database being used! \n The lines are: \n ${logs}`);
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
