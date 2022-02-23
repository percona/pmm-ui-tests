const assert = require('assert');

const pmmFrameworkLoader = 'bash /srv/pmm-qa/pmm-tests/pmm-framework.sh';
const { remoteInstancesHelper } = inject();

Feature('Monitoring SSL/TLS PGSQL instances');

const instances = new DataTable(['serviceName', 'version', 'container', 'serviceType', 'metric']);

instances.add(['pgsql_14_ssl_service', '14', 'pgsql_14', 'postgres_ssl', 'pg_stat_database_xact_rollback']);
instances.add(['pgsql_11_ssl_service', '11', 'pgsql_11', 'postgres_ssl', 'pg_stat_database_xact_rollback']);
instances.add(['pgsql_13_ssl_service', '13', 'pgsql_13', 'postgres_ssl', 'pg_stat_database_xact_rollback']);
instances.add(['pgsql_12_ssl_service', '12', 'pgsql_12', 'postgres_ssl', 'pg_stat_database_xact_rollback']);

BeforeSuite(async ({ I, codeceptjsConfig }) => {
  await I.verifyCommand(`${pmmFrameworkLoader} --pdpgsql-version=11 --setup-postgres-ssl --pmm2`);
  await I.verifyCommand(`${pmmFrameworkLoader} --pdpgsql-version=12 --setup-postgres-ssl --pmm2`);
  await I.verifyCommand(`${pmmFrameworkLoader} --pdpgsql-version=13 --setup-postgres-ssl --pmm2`);
  await I.verifyCommand(`${pmmFrameworkLoader} --pdpgsql-version=14 --setup-postgres-ssl --pmm2`);
});

AfterSuite(async ({ I, perconaServerDB }) => {
  await I.verifyCommand('docker stop mongodb_4.4 || docker rm mongodb_4.4');
});

Before(async ({ I, settingsAPI }) => {
  await I.Authorize();
});

Data(instances).Scenario(
  'Verify Adding SSL services remotely @ssl @ssl-remote',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, current, grafanaAPI,
  }) => {
    const {
      serviceName, serviceType, version, container,
    } = current;
    let details;

    if (serviceType === 'postgres_ssl') {
      details = {
        serviceName: `remote_${serviceName}`,
        serviceType,
        port: '5432',
        database: 'postgres',
        host: container,
        username: 'pmm',
        password: 'pmm',
        cluster: 'pgsql_remote_cluster',
        environment: 'pgsql_remote_cluster',
        tlsCAFile: `/srv/pmm-qa/pmm-tests/tls-ssl-setup/postgres/${version}/ca.crt`,
        tlsKeyFile: `/srv/pmm-qa/pmm-tests/tls-ssl-setup/postgres/${version}/client.pem`,
        tlsCertFile: `/srv/pmm-qa/pmm-tests/tls-ssl-setup/postgres/${version}/client.crt`,
      };
    }

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage(serviceType);
    await remoteInstancesPage.addRemoteSSLDetails(details);
    I.click(remoteInstancesPage.fields.addService);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(serviceName);
    await pmmInventoryPage.verifyAgentHasStatusRunning(serviceName);
  },
);

Data(instances).Scenario(
  'Verify metrics from SSL instances on PMM-Server @ssl @ssl-remote',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, current, grafanaAPI,
  }) => {
    const {
      serviceName, metric,
    } = current;
    let response; let result;

    // verify metric for client container node instance
    response = await grafanaAPI.checkMetricExist(metric, { type: 'service_name', value: serviceName });
    result = JSON.stringify(response.data.data.result);

    assert.ok(response.data.data.result.length !== 0, `Metrics ${metric} from ${serviceName} should be available but got empty ${result}`);

    // verify metric for remote instance
    response = await grafanaAPI.checkMetricExist(metric, { type: 'service_name', value: `${serviceName}_remote` });
    result = JSON.stringify(response.data.data.result);

    assert.ok(response.data.data.result.length !== 0, `Metrics ${metric} from ${serviceName}_remote should be available but got empty ${result}`);
  },
).retry(1);
