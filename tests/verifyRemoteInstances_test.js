const assert = require('assert');
const faker = require('faker');

const {
  remoteInstancesPage, remoteInstancesHelper, pmmInventoryPage,
} = inject();

const externalExporterServiceName = 'external_service_new';
const haproxyServiceName = 'haproxy_remote';

const instances = new DataTable(['name']);
const remotePostgreSQL = new DataTable(['instanceName', 'trackingOption', 'checkAgent']);
const qanFilters = new DataTable(['filterName']);
const dashboardCheck = new DataTable(['serviceName']);
const metrics = new DataTable(['serviceName', 'metricName']);

metrics.add(['pmm-server-postgresql', 'pg_stat_database_xact_rollback']);
metrics.add([externalExporterServiceName, 'redis_uptime_in_seconds']);
metrics.add([haproxyServiceName, 'haproxy_process_start_time_seconds']);

for (const [key, value] of Object.entries(remoteInstancesHelper.services)) {
  if (value) {
    switch (key) {
      case 'postgresql':
        // TODO: https://jira.percona.com/browse/PMM-9011
        // eslint-disable-next-line max-len
        // remotePostgreSQL.add(['postgresPGStatStatements', remoteInstancesPage.fields.usePgStatStatements, pmmInventoryPage.fields.postgresPgStatements]);
        // qanFilters.add([remoteInstancesPage.potgresqlSettings.environment]);
        // dashboardCheck.add([remoteInstancesHelper.services.postgresql]);
        // metrics.add([remoteInstancesHelper.services.postgresql, 'pg_stat_database_xact_rollback']);
        break;
      case 'mysql':
        qanFilters.add([remoteInstancesPage.mysqlSettings.environment]);
        metrics.add([remoteInstancesHelper.services.mysql, 'mysql_global_status_max_used_connections']);
        break;
      case 'postgresGC':
        dashboardCheck.add([remoteInstancesHelper.services.postgresGC]);
        qanFilters.add([remoteInstancesPage.postgresGCSettings.environment]);
        break;
      case 'mysql_ssl':
        qanFilters.add([remoteInstancesHelper.remote_instance.mysql.ms_8_0_ssl.environment]);
        break;
      case 'postgres_ssl':
        qanFilters.add([remoteInstancesHelper.remote_instance.postgresql.postgres_13_3_ssl.environment]);
        break;
      case 'mongodb':
        metrics.add([remoteInstancesHelper.services.mongodb, 'mongodb_up']);
        break;
      case 'proxysql':
        metrics.add([remoteInstancesHelper.services.proxysql, 'proxysql_up']);
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
  'PMM-T588 - Verify adding external exporter service via UI @instances @instances-fb',
  async ({ I, remoteInstancesPage, pmmInventoryPage }) => {
    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage('external');
    await remoteInstancesPage.fillRemoteFields(externalExporterServiceName);
    I.waitForVisible(remoteInstancesPage.fields.addService, 30);
    I.click(remoteInstancesPage.fields.addService);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(externalExporterServiceName);
    I.click(pmmInventoryPage.fields.agentsLink);
    I.waitForVisible(pmmInventoryPage.fields.externalExporter, 30);
  },
).retry(0);

Data(instances).Scenario(
  'PMM-T898 Verify Remote Instance Addition [critical] @instances @instances-fb',
  async ({ I, remoteInstancesPage, current }) => {
    const serviceName = remoteInstancesHelper.services[current.name];

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage(current.name);
    await remoteInstancesPage.fillRemoteFields(serviceName);
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
  'Verify Remote Instance has Status Running [critical] @instances @instances-fb',
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
    adminPage.performPageDown(1);
    I.waitForVisible(remoteInstancesPage.fields.tableStatsGroupTableLimit, 30);
    assert.strictEqual('-1', await remoteInstancesPage.getTableLimitFieldValue(), 'Count for Disabled Table Stats dont Match, was expecting -1');
    I.click(remoteInstancesPage.tableStatsLimitRadioButtonLocator('Default'));
    assert.strictEqual('1000', await remoteInstancesPage.getTableLimitFieldValue(), 'Count for Default Table Stats dont Match, was expecting 1000');
    I.click(remoteInstancesPage.tableStatsLimitRadioButtonLocator('Custom'));
    assert.strictEqual('1000', await remoteInstancesPage.getTableLimitFieldValue(), 'Count for Custom Table Stats dont Match, was expecting 1000');
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
  'PMM-T635 - Verify Adding HAProxy service via UI @instances @instances-fb',
  async ({
    I, remoteInstancesPage, pmmInventoryPage,
  }) => {
    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage('haproxy');
    I.waitForVisible(remoteInstancesPage.fields.hostName, 30);
    I.fillField(
      remoteInstancesPage.fields.hostName,
      remoteInstancesHelper.remote_instance.haproxy.haproxy_2.host,
    );
    I.fillField(remoteInstancesPage.fields.serviceName, haproxyServiceName);
    I.clearField(remoteInstancesPage.fields.portNumber);
    I.fillField(
      remoteInstancesPage.fields.portNumber,
      remoteInstancesHelper.remote_instance.haproxy.haproxy_2.port,
    );
    I.scrollPageToBottom();
    I.waitForVisible(remoteInstancesPage.fields.addService, 30);
    I.click(remoteInstancesPage.fields.addService);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(haproxyServiceName);

    await I.click(pmmInventoryPage.fields.showServiceDetails(haproxyServiceName));
    await I.click(pmmInventoryPage.fields.agentsLinkNew);
    await I.click(pmmInventoryPage.fields.showAgentDetails('External exporter'));
    await pmmInventoryPage.checkAgentOtherDetailsSection('metrics_scheme', 'metrics_scheme=http', haproxyServiceName);
    await pmmInventoryPage.checkAgentOtherDetailsSection('metrics_path', 'metrics_path=/metrics', haproxyServiceName);
    await pmmInventoryPage.checkAgentOtherDetailsSection('listen_port', `listen_port=${remoteInstancesHelper.remote_instance.haproxy.haproxy_2.port}`, haproxyServiceName);
  },
);

Scenario(
  'PMM-T1089 - Verify UI elements for PostgreSQL Instance @instances',
  async ({
    I, remoteInstancesPage,
  }) => {
    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage('postgresql');
    I.click(remoteInstancesPage.fields.addService);
    remoteInstancesPage.checkRequiredField();
    // Verify fields on the page
    I.seeElement(remoteInstancesPage.fields.returnToMenuButton, 30);
    I.seeElement(remoteInstancesPage.fields.hostName, 30);
    I.seeElement(remoteInstancesPage.fields.serviceName, 30);
    I.seeElement(remoteInstancesPage.fields.portNumber, 30);
    I.seeElement(remoteInstancesPage.fields.userName, 30);
    I.seeElement(remoteInstancesPage.fields.password, 30);
    I.seeElement(remoteInstancesPage.fields.environment, 30);
    I.seeElement(remoteInstancesPage.fields.region, 30);
    I.seeElement(remoteInstancesPage.fields.availabilityZone, 30);
    I.seeElement(remoteInstancesPage.fields.replicationSet, 30);
    I.seeElement(remoteInstancesPage.fields.cluster, 30);
    I.seeElement(remoteInstancesPage.fields.customLabels, 30);
    I.seeElement(remoteInstancesPage.fields.skipConnectionCheck, 30);
    I.seeElement(remoteInstancesPage.fields.dontTrackingRadio, 30);
    I.seeElement(remoteInstancesPage.fields.pgStatStatementsRadio, 30);
    I.seeElement(remoteInstancesPage.fields.pgStatMonitorRadio, 30);
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
    await remoteInstancesPage.fillRemoteFields(current.instanceName);
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
  'PMM-T853 - Verify dashboard after remote postgreSQL instance is added @instances',
  async ({
    I, dashboardPage, adminPage, current,
  }) => {
    // Wait 10 seconds before test to start getting metrics
    I.wait(10);
    I.amOnPage(dashboardPage.postgresqlInstanceOverviewDashboard.url);
    await dashboardPage.applyFilter('Service Name', current.serviceName);
    adminPage.performPageDown(5);
    await dashboardPage.expandEachDashboardRow();
    adminPage.performPageUp(5);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
  },
).retry(2);

Data(qanFilters).Scenario(
  'PMM-T854 - Verify QAN after remote instance is added @instances @instances-fb',
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

Data(metrics).Scenario(
  'PMM-T743 Check metrics from exporters are hitting PMM Server @instances @instances-fb',
  async ({ grafanaAPI, current }) => {
    await grafanaAPI.waitForMetric(current.metricName, { type: 'service_name', value: current.serviceName }, 10);
  },
);

Scenario(
  'PMM-T1087 Verify adding PostgreSQL remote instance without postgres database @instances',
  async ({
    I, remoteInstancesPage, grafanaAPI,
  }) => {
    const errorMessage = 'Connection check failed: pq: database "postgres" does not exist.';
    const remoteServiceName = `${faker.lorem.word()}_service`;
    const metric = 'pg_stat_database_xact_rollback';
    const details = {
      serviceName: remoteServiceName,
      serviceType: 'postgresql',
      port: remoteInstancesHelper.remote_instance.postgresql.pdpgsql_13_3.port,
      database: 'postgres',
      host: 'postgresnodb',
      username: 'test',
      password: '50mFC#z7lHZ1',
      environment: remoteInstancesPage.potgresqlSettings.environment,
      cluster: remoteInstancesPage.potgresqlSettings.cluster,
    };

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage(details.serviceType);
    await remoteInstancesPage.addRemoteDetails(details);
    I.click(remoteInstancesPage.fields.addService);
    I.verifyPopUpMessage(errorMessage);
    I.fillField(remoteInstancesPage.fields.database, 'not_default_db');
    I.click(remoteInstancesPage.fields.addService);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(remoteServiceName);
    await pmmInventoryPage.verifyAgentHasStatusRunning(remoteServiceName);
    // verify metric for client container node instance
    const response = await grafanaAPI.checkMetricExist(metric, { type: 'service_name', value: remoteServiceName });
    const result = JSON.stringify(response.data.data.result);

    assert.ok(response.data.data.result.length !== 0, `Metrics ${metric} from ${remoteServiceName} should be available but got empty ${result}`);
  },
);
