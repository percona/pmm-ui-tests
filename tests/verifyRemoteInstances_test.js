const assert = require('assert');

const { pmmInventoryPage, remoteInstancesPage, remoteInstancesHelper } = inject();

const instances = new DataTable(['name']);
const remotePostgreSQL = new DataTable(['instanceName', 'trackingOption', 'checkAgent']);
const qanFilters = new DataTable(['filterName']);
const dashboardCheck = new DataTable(['serviceName']);

for (const [key, value] of Object.entries(remoteInstancesHelper.services)) {
  if (value) {
    switch (key) {
      case 'postgresql':
        remotePostgreSQL.add(['postgreDoNotTrack', remoteInstancesPage.fields.doNotTrack, pmmInventoryPage.fields.postgresExporter]);
        remotePostgreSQL.add(['postgresPGStatStatements', remoteInstancesPage.fields.usePgStatStatements, pmmInventoryPage.fields.postgresPgStatements]);
        qanFilters.add([remoteInstancesPage.potgresqlSettings.environment]);
        dashboardCheck.add([remoteInstancesHelper.services.postgresql]);
        break;
      case 'mysql':
        qanFilters.add([remoteInstancesPage.mysqlSettings.environment]);
        break;
      case 'postgresGC':
        dashboardCheck.add([remoteInstancesHelper.services.postgresGC]);
        qanFilters.add([remoteInstancesPage.postgresGCSettings.environment]);
        break;
      default:
    }
    instances.add([key]);
  }
}

Feature('Remote DB Instances').retry(1);

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T588 - Verify adding external exporter service via UI @instances',
  async ({ I, remoteInstancesPage, pmmInventoryPage }) => {
    const serviceName = 'external_service_new';

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage('external');
    remoteInstancesPage.fillRemoteFields(serviceName);
    I.waitForVisible(remoteInstancesPage.fields.addService, 30);
    I.click(remoteInstancesPage.fields.addService);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(serviceName);
    I.click(pmmInventoryPage.fields.agentsLink);
    I.waitForVisible(pmmInventoryPage.fields.externalExporter, 30);
  },
);

Data(instances).Scenario(
  'PMM-T898 Verify Remote Instance Addition [critical] @instances',
  async ({ I, remoteInstancesPage, current }) => {
    const serviceName = remoteInstancesHelper.services[current.name];

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage(current.name);
    remoteInstancesPage.fillRemoteFields(serviceName);
    remoteInstancesPage.createRemoteInstance(serviceName);
  },
);

Scenario(
  'PMM-T590 - Verify parsing URL on adding External service page @instances',
  async ({ I, remoteInstancesPage }) => {
    const metricsPath = '/metrics2';
    const credentials = 'something';
    const url = `https://something:something@${process.env.MONITORING_HOST}:${process.env.EXTERNAL_EXPORTER_PORT}/metrics2`;

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage('external');
    remoteInstancesPage.parseURL(url);
    await remoteInstancesPage.checkParsing(metricsPath, credentials);
  },
);

Scenario(
  'PMM-T630 - Verify adding External service with empty fields via UI @instances',
  async ({ I, remoteInstancesPage }) => {
    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage('external');
    I.waitForVisible(remoteInstancesPage.fields.addService, 30);
    I.click(remoteInstancesPage.fields.addService);
    remoteInstancesPage.checkRequiredField();
  },
);

Data(instances).Scenario(
  'Verify Remote Instance has Status Running [critical] @instances',
  async ({
    I, pmmInventoryPage, current,
  }) => {
    const serviceName = remoteInstancesHelper.services[current.name];

    I.amOnPage(pmmInventoryPage.url);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(serviceName);
    await pmmInventoryPage.verifyAgentHasStatusRunning(serviceName);
  },
);

Scenario(
  'TableStats UI Default table Options for Remote MySQL & AWS-RDS Instance @instances',
  async ({ I, remoteInstancesPage, adminPage }) => {
    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage('mysql');
    adminPage.peformPageDown(1);
    I.waitForVisible(remoteInstancesPage.fields.tableStatsGroupTableLimit, 30);
    assert.strictEqual('-1', await remoteInstancesPage.getTableLimitFieldValue(), 'Count for Disabled Table Stats dont Match, was expecting -1');
    I.click(remoteInstancesPage.tableStatsLimitRadioButtonLocator('Default'));
    assert.strictEqual('1000', await remoteInstancesPage.getTableLimitFieldValue(), 'Count for Default Table Stats dont Match, was expecting 1000');
    I.click(remoteInstancesPage.tableStatsLimitRadioButtonLocator('Custom'));
    assert.strictEqual('1000', await remoteInstancesPage.getTableLimitFieldValue(), 'Count for Custom Table Stats dont Match, was expecting 1000');
  },
);

Scenario(
  'PMM-T743 - Check metrics from external exporter on Advanced Data Exploration Dashboard @instances',
  async ({ I, dashboardPage }) => {
    const metricName = 'redis_uptime_in_seconds';

    // This is only needed to let PMM Consume Metrics from external Service
    I.wait(10);
    const response = await dashboardPage.checkMetricExist(metricName);
    const result = JSON.stringify(response.data.data.result);

    assert.ok(response.data.data.result.length !== 0, `Metrics ${metricName} from external exporter should be available but got empty ${result}`);
  },
);

Scenario(
  'PMM-T637 - Verify elements on HAProxy page @instances',
  async ({ I, remoteInstancesPage }) => {
    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage('haproxy');
    I.waitForVisible(remoteInstancesPage.fields.returnToMenuButton, 30);
    I.waitForVisible(remoteInstancesPage.fields.hostName, 30);
    I.waitForVisible(remoteInstancesPage.fields.serviceName, 30);
    I.waitForVisible(remoteInstancesPage.fields.portNumber, 30);
    I.waitForVisible(remoteInstancesPage.fields.userName, 30);
    I.waitForVisible(remoteInstancesPage.fields.password, 30);
    I.waitForVisible(remoteInstancesPage.fields.environment, 30);
    I.waitForVisible(remoteInstancesPage.fields.region, 30);
    I.waitForVisible(remoteInstancesPage.fields.availabilityZone, 30);
    I.waitForVisible(remoteInstancesPage.fields.replicationSet, 30);
    I.waitForVisible(remoteInstancesPage.fields.cluster, 30);
    I.waitForVisible(remoteInstancesPage.fields.customLabels, 30);
    I.waitForVisible(remoteInstancesPage.fields.skipConnectionCheck, 30);
  },
);

Scenario(
  'PMM-T636 - Verify adding HAProxy with all empty fields @instances',
  async ({ I, remoteInstancesPage }) => {
    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage('haproxy');
    I.waitForVisible(remoteInstancesPage.fields.addService, 30);
    I.click(remoteInstancesPage.fields.addService);
    I.waitForVisible(remoteInstancesPage.fields.requiredFieldHostname, 30);
  },
);

Scenario(
  'PMM-T635 - Verify Adding HAProxy service via UI @not-ovf @instances',
  async ({
    I, remoteInstancesPage, pmmInventoryPage,
  }) => {
    const serviceName = 'haproxy_remote';

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage('haproxy');
    I.waitForVisible(remoteInstancesPage.fields.hostName, 30);
    I.fillField(
      remoteInstancesPage.fields.hostName,
      remoteInstancesHelper.remote_instance.haproxy.haproxy_2.host,
    );
    I.fillField(remoteInstancesPage.fields.serviceName, serviceName);
    I.clearField(remoteInstancesPage.fields.portNumber);
    I.fillField(
      remoteInstancesPage.fields.portNumber,
      remoteInstancesHelper.remote_instance.haproxy.haproxy_2.port,
    );
    I.scrollPageToBottom();
    I.waitForVisible(remoteInstancesPage.fields.addService, 30);
    I.click(remoteInstancesPage.fields.addService);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(serviceName);
    const serviceId = await pmmInventoryPage.getServiceId(serviceName);

    I.click(pmmInventoryPage.fields.agentsLink);
    await pmmInventoryPage.checkAgentOtherDetailsSection('scheme:', 'scheme: http', serviceName, serviceId);
    await pmmInventoryPage.checkAgentOtherDetailsSection('metrics_path:', 'metrics_path: /metrics', serviceName, serviceId);
    await pmmInventoryPage.checkAgentOtherDetailsSection('listen_port:', `listen_port: ${remoteInstancesHelper.remote_instance.haproxy.haproxy_2.port}`, serviceName, serviceId);
  },
);

Data(remotePostgreSQL).Scenario(
  'PMM-T441 - Verify adding Remote PostgreSQL Instance @instances',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, current,
  }) => {
    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage('postgresql');
    remoteInstancesPage.fillRemoteFields(current.instanceName);
    I.waitForVisible(remoteInstancesPage.fields.skipTLSL, 30);
    I.click(remoteInstancesPage.fields.skipTLSL);
    I.click(current.trackingOption);
    I.click(remoteInstancesPage.fields.addService);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(current.instanceName);
    await pmmInventoryPage.verifyAgentHasStatusRunning(current.instanceName);
    pmmInventoryPage.checkExistingAgent(current.checkAgent);
  },
);

Data(dashboardCheck).Scenario(
  'PMM-T853 - Verify dashboard after remote postgreSQL instance is added @instances @not-ovf',
  async ({
    I, dashboardPage, adminPage, current,
  }) => {
    // Wait 10 seconds before test to start getting metrics
    I.wait(10);
    I.amOnPage(dashboardPage.postgresqlInstanceOverviewDashboard.url);
    await dashboardPage.applyFilter('Service Name', current.serviceName);
    adminPage.peformPageDown(5);
    await dashboardPage.expandEachDashboardRow();
    adminPage.performPageUp(5);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
  },
).retry(2);

Data(qanFilters).Scenario(
  'PMM-T854 - Verify QAN after remote instance is added @instances',
  async ({
    I, qanOverview, qanFilters, qanPage, current,
  }) => {
    I.amOnPage(qanPage.url);
    qanOverview.waitForOverviewLoaded();
    await qanFilters.applyFilter(current.filterName);
    qanOverview.waitForOverviewLoaded();
    const count = await qanOverview.getCountOfItems();

    assert.ok(count > 0, `The queries for filter ${current.filterName} instance do NOT exist`);
  },
).retry(2);
