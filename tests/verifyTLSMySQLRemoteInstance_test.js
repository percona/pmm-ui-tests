const assert = require('assert');

const pmmFrameworkLoader = 'bash /srv/pmm-qa/pmm-tests/pmm-framework.sh';
const { remoteInstancesHelper } = inject();

Feature('Monitoring SSL/TLS MYSQL instances');

const instances = new DataTable(['serviceName', 'version', 'container', 'serviceType', 'metric']);

instances.add(['mysql_57_ssl_service', '5.7', 'mysql_57', 'mysql_ssl', 'mysql_global_status_max_used_connections']);
instances.add(['mysql_80_ssl_service', '8.0', 'mysql_80', 'mysql_ssl', 'mysql_global_status_max_used_connections']);

BeforeSuite(async ({ I, codeceptjsConfig }) => {
  await I.verifyCommand(`${pmmFrameworkLoader} --ps-version=5.7 --setup-mysql-ssl --pmm2`);
  await I.verifyCommand(`${pmmFrameworkLoader} --ps-version=8.0 --setup-mysql-ssl --pmm2`);
});

AfterSuite(async ({ I, perconaServerDB }) => {
  await I.verifyCommand('docker stop mysql_57 || docker rm mysql_57');
  await I.verifyCommand('docker stop mysql_80 || docker rm mysql_80');
});

Before(async ({ I, settingsAPI }) => {
  await I.Authorize();
});

Data(instances).Scenario(
  'Verify Adding SSL services remotely @ssl @ssl-remote',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, current, inventoryAPI,
  }) => {
    const {
      serviceName, serviceType, version, container,
    } = current;
    let details;
    const remoteServiceName = `remote_${serviceName}`;

    if (serviceType === 'mysql_ssl') {
      details = {
        serviceName: remoteServiceName,
        serviceType,
        port: '3306',
        host: container,
        username: 'pmm',
        password: 'pmm',
        cluster: 'mysql_remote_cluster',
        environment: 'mysql_remote_cluster',
        tlsCAFile: `/srv/pmm-qa/pmm-tests/tls-ssl-setup/mysql/${version}/ca.pem`,
        tlsKeyFile: `/srv/pmm-qa/pmm-tests/tls-ssl-setup/mysql/${version}/client-key.pem`,
        tlsCertFile: `/srv/pmm-qa/pmm-tests/tls-ssl-setup/mysql/${version}/client-cert.pem`,
      };
    }

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage(serviceType);
    await remoteInstancesPage.addRemoteSSLDetails(details);
    I.click(remoteInstancesPage.fields.addService);
    await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
      {
        serviceType: 'MYSQL_SERVICE',
        service: 'mysql',
      },
      serviceName,
    );

    // Check Remote Instance also added and have running status
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(remoteServiceName);
    await pmmInventoryPage.verifyAgentHasStatusRunning(remoteServiceName);
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
