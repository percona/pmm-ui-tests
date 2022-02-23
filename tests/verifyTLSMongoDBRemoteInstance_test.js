const assert = require('assert');

const pmmFrameworkLoader = 'bash /srv/pmm-qa/pmm-tests/pmm-framework.sh';
const { remoteInstancesHelper } = inject();

Feature('Monitoring SSL/TLS MongoDB instances');

const instances = new DataTable(['serviceName', 'version', 'container', 'serviceType', 'metric']);

instances.add(['mongodb_4.4_ssl_service', '4.4', 'mongodb_4.4', 'mongodb_ssl', 'mongodb_connections']);
instances.add(['mongodb_4.2_ssl_service', '4.2', 'mongodb_4.2', 'mongodb_ssl', 'mongodb_connections']);
instances.add(['mongodb_4.0_ssl_service', '4.0', 'mongodb_4.0', 'mongodb_ssl', 'mongodb_connections']);
instances.add(['mongodb_5.0_ssl_service', '5.0', 'mongodb_5.0', 'mongodb_ssl', 'mongodb_connections']);

BeforeSuite(async ({ I, codeceptjsConfig }) => {
  await I.verifyCommand(`${pmmFrameworkLoader} --mo-version=4.0 --setup-mongodb-ssl --pmm2`);
  await I.verifyCommand(`${pmmFrameworkLoader} --mo-version=4.2 --setup-mongodb-ssl --pmm2`);
  await I.verifyCommand(`${pmmFrameworkLoader} --mo-version=4.4 --setup-mongodb-ssl --pmm2`);
  await I.verifyCommand(`${pmmFrameworkLoader} --mo-version=5.0 --setup-mongodb-ssl --pmm2`);
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

    if (serviceType === 'mongodb_ssl') {
      details = {
        serviceName: `${serviceName}_remote`,
        serviceType,
        port: '27017',
        host: container,
        cluster: 'mongodb_remote_cluster',
        environment: 'mongodb_remote_cluster',
        tlsCAFile: `/srv/pmm-qa/pmm-tests/tls-ssl-setup/mongodb/${version}/ca.crt`,
        tlsCertificateFilePasswordInput: `/srv/pmm-qa/pmm-tests/tls-ssl-setup/mongodb/${version}/client.crt`,
        tlsCertificateKeyFile: `/srv/pmm-qa/pmm-tests/tls-ssl-setup/mongodb/${version}/client.pem`,
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
