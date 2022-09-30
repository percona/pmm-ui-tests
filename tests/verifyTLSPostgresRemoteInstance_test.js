const assert = require('assert');
const faker = require('faker');

const { adminPage } = inject();
const pmmFrameworkLoader = `bash ${adminPage.pathToFramework}`;
const pathToPMMFramework = adminPage.pathToPMMTests;

Feature('Monitoring SSL/TLS PGSQL instances');

const instances = new DataTable(['serviceName', 'version', 'container', 'serviceType', 'metric']);

instances.add(['pgsql_14_ssl_service', '14', 'pgsql_14', 'postgres_ssl', 'pg_stat_database_xact_rollback']);
// skipping this due to bug in setup due to repo and packages
// instances.add(['pgsql_12_ssl_service', '12', 'pgsql_12', 'postgres_ssl', 'pg_stat_database_xact_rollback']);
// instances.add(['pgsql_11_ssl_service', '11', 'pgsql_11', 'postgres_ssl', 'pg_stat_database_xact_rollback']);
// instances.add(['pgsql_13_ssl_service', '13', 'pgsql_13', 'postgres_ssl', 'pg_stat_database_xact_rollback']);

BeforeSuite(async ({ I, codeceptjsConfig }) => {
  // await I.verifyCommand(`${pmmFrameworkLoader} --pdpgsql-version=11 --setup-postgres-ssl --pmm2`);
  // await I.verifyCommand(`${pmmFrameworkLoader} --pdpgsql-version=12 --setup-postgres-ssl --pmm2`);
  // await I.verifyCommand(`${pmmFrameworkLoader} --pdpgsql-version=13 --setup-postgres-ssl --pmm2`);
  // await I.verifyCommand(`${pmmFrameworkLoader} --pdpgsql-version=14 --setup-postgres-ssl --pmm2`);
});

AfterSuite(async ({ I }) => {
  // await I.verifyCommand('docker stop pgsql_11 || docker rm pgsql_11');
  // await I.verifyCommand('docker stop pgsql_12 || docker rm pgsql_12');
  // await I.verifyCommand('docker stop pgsql_13 || docker rm pgsql_13');
  // await I.verifyCommand('docker stop pgsql_14 || docker rm pgsql_14');
});

Before(async ({ I, settingsAPI }) => {
  await I.Authorize();
});

Data(instances).Scenario(
  'PMM-T948 PMM-T947 Verify Adding SSL services remotely @ssl @ssl-remote @not-ui-pipeline',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, current, inventoryAPI,
  }) => {
    const {
      serviceName, serviceType, version, container,
    } = current;
    let details;
    const remoteServiceName = `remote_${serviceName}`;

    if (serviceType === 'postgres_ssl') {
      details = {
        serviceName: remoteServiceName,
        serviceType,
        port: '5432',
        database: 'postgres',
        host: container,
        username: 'pmm',
        password: 'pmm',
        cluster: 'pgsql_remote_cluster',
        environment: 'pgsql_remote_cluster',
        tlsCAFile: `${pathToPMMFramework}tls-ssl-setup/postgres/${version}/ca.crt`,
        tlsKeyFile: `${pathToPMMFramework}tls-ssl-setup/postgres/${version}/client.pem`,
        tlsCertFile: `${pathToPMMFramework}tls-ssl-setup/postgres/${version}/client.crt`,
      };
    }

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage(serviceType);
    await remoteInstancesPage.addRemoteSSLDetails(details);
    I.click(remoteInstancesPage.fields.addService);
    await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
      {
        serviceType: 'POSTGRESQL_SERVICE',
        service: 'postgresql',
      },
      serviceName,
    );

    // Check Remote Instance also added and have running status
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(remoteServiceName);
    await pmmInventoryPage.verifyAgentHasStatusRunning(remoteServiceName);
  },
);

Data(instances).Scenario(
  'Verify metrics from SSL instances on PMM-Server @ssl @ssl-remote @not-ui-pipeline',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, current, grafanaAPI,
  }) => {
    const {
      serviceName, metric,
    } = current;
    let response; let result;
    const remoteServiceName = `remote_${serviceName}`;

    // Waiting for metrics to start hitting for remotely added services
    I.wait(10);

    // verify metric for client container node instance
    response = await grafanaAPI.checkMetricExist(metric, { type: 'service_name', value: serviceName });
    result = JSON.stringify(response.data.data.result);

    assert.ok(response.data.data.result.length !== 0, `Metrics ${metric} from ${serviceName} should be available but got empty ${result}`);

    // verify metric for remote instance
    response = await grafanaAPI.checkMetricExist(metric, { type: 'service_name', value: remoteServiceName });
    result = JSON.stringify(response.data.data.result);

    assert.ok(response.data.data.result.length !== 0, `Metrics ${metric} from ${remoteServiceName} should be available but got empty ${result}`);
  },
).retry(1);

Data(instances).Scenario(
  'PMM-T946 Verify adding PostgreSQL with --tls flag and with missing TLS options @ssl @ssl-remote @not-ui-pipeline',
  async ({
    I, current, grafanaAPI,
  }) => {
    const {
      container,
    } = current;

    let responseMessage = 'Connection check failed: tls: failed to find any PEM data in key input.\n';
    let command = `docker exec ${container} pmm-admin add postgresql --tls --tls-ca-file=./certificates/ca.crt --tls-cert-file=./certificates/client.crt --port=5432 --username=pmm --password=pmm--service-name=PG_tls`;

    let output = await I.verifyCommand(command, responseMessage, 'fail');

    assert.ok(output === responseMessage, `The ${command} was supposed to return ${responseMessage} but actually got ${output}`);

    responseMessage = 'Connection check failed: tls: failed to find any PEM data in certificate input.\n';
    command = `docker exec ${container} pmm-admin add postgresql --tls --tls-ca-file=./certificates/ca.crt --tls-key-file=./certificates/client.pem --port=5432 --username=pmm --password=pmm --service-name=PG_tls`;

    output = await I.verifyCommand(command, responseMessage, 'fail');

    assert.ok(output === responseMessage, `The ${command} was supposed to return ${responseMessage} but actually got ${output}`);

    responseMessage = 'Connection check failed: pq: couldn\'t parse pem in sslrootcert.\n';
    command = `docker exec ${container} pmm-admin add postgresql --tls --tls-cert-file=./certificates/client.crt --tls-key-file=./certificates/client.pem --port=5432 --username=pmm --password=pmm --service-name=PG_tls`;

    output = await I.verifyCommand(command, responseMessage, 'fail');

    assert.ok(output === responseMessage, `The ${command} was supposed to return ${responseMessage} but actually got ${output}`);

    responseMessage = 'Connection check failed: x509: certificate signed by unknown authority.\n';
    command = `docker exec ${container} pmm-admin add postgresql --tls --port=5432 --username=pmm --password=pmm --service-name=PG_tls_2`;

    output = await I.verifyCommand(command, responseMessage, 'fail');

    assert.ok(output === responseMessage, `The ${command} was supposed to return ${responseMessage} but actually got ${output}`);
  },
).retry(1);

Data(instances).Scenario(
  'Verify dashboard after PGSQL SSL Instances are added @ssl @ssl-remote @not-ui-pipeline',
  async ({
    I, dashboardPage, adminPage, current,
  }) => {
    const {
      serviceName,
    } = current;

    const serviceList = [serviceName, `remote_${serviceName}`];

    for (const service of serviceList) {
      I.amOnPage(dashboardPage.postgresqlInstanceOverviewDashboard.url);
      dashboardPage.waitForDashboardOpened();
      await adminPage.applyTimeRange('Last 5 minutes');
      await dashboardPage.applyFilter('Service Name', service);
      adminPage.performPageDown(5);
      await dashboardPage.expandEachDashboardRow();
      adminPage.performPageUp(5);
      await dashboardPage.verifyThereAreNoGraphsWithNA();
      await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
    }
  },
).retry(2);

Data(instances).Scenario(
  'Verify QAN after PGSQL SSL Instances is added @ssl @ssl-remote @not-ui-pipeline',
  async ({
    I, qanOverview, qanFilters, qanPage, current, adminPage,
  }) => {
    const {
      serviceName,
    } = current;

    const serviceList = [serviceName, `remote_${serviceName}`];

    for (const service of serviceList) {
      I.amOnPage(qanPage.url);
      qanOverview.waitForOverviewLoaded();
      await adminPage.applyTimeRange('Last 12 hours');
      qanOverview.waitForOverviewLoaded();
      qanFilters.waitForFiltersToLoad();
      await qanFilters.applySpecificFilter(service);
      qanOverview.waitForOverviewLoaded();
      const count = await qanOverview.getCountOfItems();

      assert.ok(count > 0, `The queries for service ${service} instance do NOT exist, check QAN Data`);
    }
  },
).retry(1);

Data(instances).Scenario(
  'PMM-T1294 Verify that pmm-admin inventory add agent qan-mongodb-profiler-agent without --log-level flag adds QAN MongoDB Profiler Agent with log-level=warn',
  async ({
    I, current, cliHelper,
  }) => {
    const {
      version,
      container,
    } = current;

    const dbName = 'postgresql';
    const dbPort = '5432';
    const agentName = 'postgres-exporter';
    const agentFlags = '--tls --tls-skip-verify --tlsca-file=./certificates/ca.crt --tls-cert-file=./certificates/client.crt --tls-key-file=./certificates/client.pem';
    const authInfo = 'pmm --password=pmm';

    await cliHelper.setupAndVerifyAgent(dbName, version, dbPort, container, agentName, agentFlags, authInfo);
  },
).retry(1);
Data(instances).Scenario(
  'PMM-T1294 Verify that pmm-admin inventory add agent qan-mongodb-profiler-agent without --log-level flag adds QAN MongoDB Profiler Agent with log-level=warn',
  async ({
    I, current, inventoryAPI, qanPage, qanFilters, qanOverview, adminPage, cliHelper,
  }) => {
    const {
      version,
      container,
    } = current;

    const dbName = 'postgresql';
    const dbPort = '5432';
    const agentName = 'postgres-exporter';
    const agentFlags = '--tls --tls-skip-verify --tlsca-file=./certificates/ca.crt --tls-cert-file=./certificates/client.crt --tls-key-file=./certificates/client.pem';

    const serviceName = await cliHelper.setupAndVerifyAgent(dbName, version, dbPort, container, agentName, agentFlags);

    await I.Authorize();
    I.amOnPage(qanPage.url);
    qanPage.verifyServicePresentInQAN(serviceName);
  },
).retry(1);
