const assert = require('assert');
const faker = require('faker');

const { adminPage } = inject();
const pmmFrameworkLoader = `bash ${adminPage.pathToFramework}`;

const { remoteInstancesPage, remoteInstancesHelper, pmmInventoryPage } = inject();

const externalExporterServiceName = 'external_service_new';
const haproxyServiceName = 'haproxy_remote';
const pathToSSL = '~/WebstormProjects/pmm-qa/pmm-tests/tls-ssl-setup/';
const instanceDetails = {
  mysql: {
    details: {
      serviceName: 'ASSIGN_SERVICE_NAME',
      serviceType: 'mysql_ssl',
      port: '3306',
      host: 'ASSIGN_HOST_NAME',
      username: 'pmm',
      password: 'pmm',
      cluster: 'mysql_remote_cluster',
      environment: 'mysql_remote_cluster',
      tlsCAFile: `${pathToSSL}mysql/8.0/ca.pem`,
      tlsKeyFile: `${pathToSSL}mysql/8.0/client-key.pem`,
      tlsCertFile: `${pathToSSL}mysql/8.0/client-cert.pem`,
    },
    serviceInfo: {
      serviceType: 'MYSQL_SERVICE',
      service: 'mysql',
    },
  },
  mongodb: {
    details: {
      serviceName: 'ASSIGN_SERVICE_NAME',
      serviceType: 'mongodb_ssl',
      port: '27017',
      host: 'ASSIGN_HOST_NAME',
      cluster: 'mongodb_remote_cluster',
      environment: 'mongodb_remote_cluster',
      tlsCAFile: `${pathToSSL}mongodb/5.0/ca.crt`,
      tlsCertificateFilePasswordInput: `${pathToSSL}mongodb/5.0/client.key`,
      tlsCertificateKeyFile: `${pathToSSL}mongodb/5.0/client.pem`,
    },
    serviceInfo: {
      serviceType: 'MONGODB_SERVICE',
      service: 'mongodb',
    },
  },
  postgresql: {
    details: {
      serviceName: 'ASSIGN_SERVICE_NAME',
      serviceType: 'postgres_ssl',
      port: '5432',
      database: 'postgres',
      host: 'ASSIGN_HOST_NAME',
      username: 'pmm',
      password: 'pmm',
      cluster: 'pgsql_remote_cluster',
      environment: 'pgsql_remote_cluster',
      tlsCAFile: `${pathToSSL}postgres/14/ca.crt`,
      tlsKeyFile: `${pathToSSL}postgres/14/client.pem`,
      tlsCertFile: `${pathToSSL}postgres/14/client.crt`,
    },
    serviceInfo: {
      serviceType: 'POSTGRESQL_SERVICE',
      service: 'postgresql',
    },
  },
};

const instances = new DataTable(['name']);
const remotePostgreSQL = new DataTable(['instanceName', 'trackingOption', 'checkAgent']);
const qanFilters = new DataTable(['filterName']);
const dashboardCheck = new DataTable(['serviceName']);
const metrics = new DataTable(['serviceName', 'metricName']);
const maxQueryLengthTestData = new DataTable(['text']);
const maxQueryLengthTestInstances = new DataTable(['instanceName', 'container', 'maxQueryLength']);

const sslInstances = new DataTable(['serviceName', 'version', 'container', 'serviceType', 'metric']);

sslInstances.add(['mongodb_5.0_ssl_service', '5.0', 'mongodb_5.0', 'mongodb_ssl', 'mongodb_connections']);
sslInstances.add(['mysql_8.0_ssl_service', '8.0', 'mysql_8.0', 'mysql_ssl', 'mysql_global_status_max_used_connections']);
sslInstances.add(['pgsql_14_ssl_service', '14', 'pgsql_14', 'postgres_ssl', 'pg_stat_database_xact_rollback']);

BeforeSuite(async ({ I }) => {
  await I.verifyCommand(`${pmmFrameworkLoader} --ps-version=8.0 --setup-mysql-ssl --pmm2`);
  await I.verifyCommand(`${pmmFrameworkLoader} --mo-version=5.0 --setup-mongodb-ssl --pmm2`);
  await I.verifyCommand(`${pmmFrameworkLoader} --pdpgsql-version=14 --setup-postgres-ssl --pmm2`);
});

AfterSuite(async ({ I }) => {
  await I.verifyCommand('docker stop mysql_8.0 || docker rm mysql_8.0');
  await I.verifyCommand('docker stop pgsql_14 || docker rm pgsql_14');
  await I.verifyCommand('docker stop mongodb_5.0 || docker rm mongodb_5.0');
});

metrics.add(['pmm-server-postgresql', 'pg_stat_database_xact_rollback']);
metrics.add([externalExporterServiceName, 'redis_uptime_in_seconds']);
metrics.add([haproxyServiceName, 'haproxy_process_start_time_seconds']);

maxQueryLengthTestInstances.add(['mysql', 'mysql_8.0', '']);
maxQueryLengthTestInstances.add(['mysql', 'mysql_8.0', -1]);
maxQueryLengthTestInstances.add(['mysql', 'mysql_8.0', 10]);
maxQueryLengthTestInstances.add(['mysql', 'mysql_8.0', 1000]);
maxQueryLengthTestInstances.add(['mongodb', 'mongodb_5.0', '']);
maxQueryLengthTestInstances.add(['mongodb', 'mongodb_5.0', -1]);
maxQueryLengthTestInstances.add(['mongodb', 'mongodb_5.0', 10]);
maxQueryLengthTestInstances.add(['mongodb', 'mongodb_5.0', 1000]);
maxQueryLengthTestInstances.add(['postgresql', 'pgsql_14', '']);
maxQueryLengthTestInstances.add(['postgresql', 'pgsql_14', -1]);
maxQueryLengthTestInstances.add(['postgresql', 'pgsql_14', 10]);
maxQueryLengthTestInstances.add(['postgresql', 'pgsql_14', 1000]);

maxQueryLengthTestData.add(['---;']);
maxQueryLengthTestData.add(['aa']);
maxQueryLengthTestData.add(['^']);
maxQueryLengthTestData.add(['`']);
maxQueryLengthTestData.add(['"']);

for (const [key, value] of Object.entries(remoteInstancesHelper.services)) {
  if (value) {
    const agentName = '';

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
  'PMM-T588 - Verify adding external exporter service via UI @instances @fb',
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
);

Data(instances).Scenario(
  'PMM-T898 Verify Remote Instance Addition [critical] @instances @fb',
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
  'Verify Remote Instance has Status Running [critical] @instances @fb',
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
  'PMM-T635 - Verify Adding HAProxy service via UI @instances @fb',
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
    const serviceId = await pmmInventoryPage.getServiceId(haproxyServiceName);

    I.click(pmmInventoryPage.fields.agentsLink);
    await pmmInventoryPage.checkAgentOtherDetailsSection('scheme:', 'scheme: http', haproxyServiceName, serviceId);
    await pmmInventoryPage.checkAgentOtherDetailsSection('metrics_path:', 'metrics_path: /metrics', haproxyServiceName, serviceId);
    await pmmInventoryPage.checkAgentOtherDetailsSection('listen_port:', `listen_port: ${remoteInstancesHelper.remote_instance.haproxy.haproxy_2.port}`, haproxyServiceName, serviceId);
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
  'PMM-T854 - Verify QAN after remote instance is added @instances @fb',
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
  'PMM-T743 Check metrics from exporters are hitting PMM Server @instances @fb',
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
      password: 'test',
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

Data(maxQueryLengthTestData).Scenario(
  'PMM-T1405 Verify validation of Max Query Length option on Add remote MySQL page @nazarov',
  async ({
    I, remoteInstancesPage, current,
  }) => {
    const maxLength = current.text;

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage('mysql');
    I.fillField(remoteInstancesPage.fields.maxQueryLength, maxLength);
    I.waitForText('Value should be greater or equal to -1', 30, remoteInstancesPage.fields.maxQueryLengthError);
  },
);

Data(maxQueryLengthTestInstances).Scenario(
  'PMM-T1403 Verify Max Query Length field is not required on Add remote MySQL instance page'
  + ' PMM-T1404 Verify Max Query Length option can be set to -1 on Add remote MySQL page'
  + ' PMM-T1426 Verify remote PostgreSQL can be added with specified Max Query Length'
  + ' PMM-T1431 Verify adding MongoDB instance via UI with specified Max Query Length option @nazarov',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, qanPage, qanOverview, qanFilters, qanDetails, inventoryAPI, current,
  }) => {
    const { instanceName, container, maxQueryLength } = current;
    const { serviceInfo } = instanceDetails[instanceName];
    const remoteServiceName = `${faker.random.alpha(3)}_remote_${instanceName}`;

    const { details } = instanceDetails[instanceName];

    details.serviceName = remoteServiceName;
    details.host = container;

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage(details.serviceType);
    await remoteInstancesPage.addRemoteSSLDetails(details);

    if (maxQueryLength !== '') {
      I.fillField(remoteInstancesPage.fields.maxQueryLength, maxQueryLength);
    }

    I.click(remoteInstancesPage.fields.addService);
    await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
      serviceInfo,
      remoteServiceName,
    );

    // Check Remote Instance also added and have running status
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(remoteServiceName);
    await pmmInventoryPage.verifyAgentHasStatusRunning(remoteServiceName);
    await pmmInventoryPage.openServices();
    const serviceId = await pmmInventoryPage.getServiceId(remoteServiceName);

    // Check Remote Instance also added and have correct max_query_length option set
    await pmmInventoryPage.openAgents();

    if (maxQueryLength !== '') {
      await pmmInventoryPage.checkAgentOtherDetailsSection('max_query_length:', `max_query_length: ${maxQueryLength}`, remoteServiceName, serviceId);
    } else {
      await pmmInventoryPage.checkAgentOtherDetailsMissing('max_query_length:', serviceId);
    }

    // Check max visible query length is less than max_query_length option
    I.amOnPage(I.buildUrlWithParams(qanPage.clearUrl, { from: 'now-5m' }));
    qanOverview.waitForOverviewLoaded();
    await qanFilters.applyFilter(remoteServiceName);
    I.waitForElement(qanOverview.elements.querySelector, 30);
    const queryFromRow = await qanOverview.getQueryFromRow(1);

    if (maxQueryLength !== '' && maxQueryLength !== -1) {
      assert.ok(queryFromRow.length <= maxQueryLength, `Query length exceeds max length boundary equals ${queryFromRow.length} is more than ${maxQueryLength}`);
    } else {
      // 6 is chosen because it's the length of "SELECT" any query that starts with that word should be longer
      assert.ok(queryFromRow.length >= 6, `Query length is equal to ${queryFromRow.length} which is less than minimal possible length`);
      qanOverview.selectRow(1);
      qanFilters.waitForFiltersToLoad();
      qanDetails.checkExamplesTab();
      qanDetails.checkExplainTab();
    }
  },
);
