const assert = require('assert');

const { adminPage } = inject();
const pmmFrameworkLoader = `bash ${adminPage.pathToFramework}`;
const pathToPMMFramework = adminPage.pathToPMMTests;

Feature('Monitoring SSL/TLS MongoDB instances');

const instances = new DataTable(['serviceName', 'version', 'container', 'serviceType', 'metric']);

instances.add(['mongodb_4.4_ssl_service', '4.4', 'mongodb_4.4', 'mongodb_ssl', 'mongodb_connections']);
// instances.add(['mongodb_4.2_ssl_service', '4.2', 'mongodb_4.2', 'mongodb_ssl', 'mongodb_connections']);
instances.add(['mongodb_5.0_ssl_service', '5.0', 'mongodb_5.0', 'mongodb_ssl', 'mongodb_connections']);

const logLevels = ['', 'debug', 'info', 'warn', 'error', 'fatal'];

const dbName = 'mongodb';
const dbPort = '27017';
const agentFlags = '--tls-skip-verify --tls --authentication-mechanism=MONGODB-X509 --tls-certificate-key-file=/nodes/certificates/client.pem --tls-certificate-key-file-password=/nodes/certificates/client.key --tls-ca-file=/nodes/certificates/ca.crt';

BeforeSuite(async ({ I }) => {
  await I.verifyCommand(`${pmmFrameworkLoader} --mo-version=4.2 --setup-mongodb-ssl --pmm2`);
  // await I.verifyCommand(`${pmmFrameworkLoader} --mo-version=4.4 --setup-mongodb-ssl --pmm2`);
  await I.verifyCommand(`${pmmFrameworkLoader} --mo-version=5.0 --setup-mongodb-ssl --pmm2`);
});

AfterSuite(async ({ I }) => {
  await I.verifyCommand('docker stop mongodb_4.4 || docker rm mongodb_4.4');
  // await I.verifyCommand('docker stop mongodb_4.2 || docker rm mongodb_4.2');
  await I.verifyCommand('docker stop mongodb_5.0 || docker rm mongodb_5.0');
});

Before(async ({ I }) => {
  await I.Authorize();
});

Data(instances).Scenario(
  'PMM-T888 PMM-T919 Verify Adding SSL services remotely @ssl @ssl-remote @not-ui-pipeline',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, current, inventoryAPI,
  }) => {
    const {
      serviceName, serviceType, version, container,
    } = current;
    let details;
    const remoteServiceName = `remote_${serviceName}`;

    if (serviceType === 'mongodb_ssl') {
      details = {
        serviceName: remoteServiceName,
        serviceType,
        port: '27017',
        host: container,
        cluster: 'mongodb_remote_cluster',
        environment: 'mongodb_remote_cluster',
        tlsCAFile: `${pathToPMMFramework}tls-ssl-setup/mongodb/${version}/ca.crt`,
        tlsCertificateFilePasswordInput: `${pathToPMMFramework}tls-ssl-setup/mongodb/${version}/client.key`,
        tlsCertificateKeyFile: `${pathToPMMFramework}tls-ssl-setup/mongodb/${version}/client.pem`,
      };
    }

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage(serviceType);
    await remoteInstancesPage.addRemoteSSLDetails(details);
    I.click(remoteInstancesPage.fields.addService);
    await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
      {
        serviceType: 'MONGODB_SERVICE',
        service: 'mongodb',
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
    I, current, grafanaAPI,
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
  'PMM-T926 PMM-T927 Verify there is no possibility to add MongoDB Service with only CA file specified,'
    + 'Verify there is no possibility to add MongoDB Service with only certificate file specified @ssl @ssl-remote @not-ui-pipeline',
  async ({
    I, current,
  }) => {
    const {
      container,
    } = current;
    let responseMessage = 'Connection check failed: server selection error: server selection timeout, current topology:';
    let command = `docker exec ${container} pmm-admin add mongodb --tls --tls-skip-verify --authentication-mechanism=MONGODB-X509 --authentication-database=$external --tls-ca-file=/nodes/certificates/ca.crt TLS_MongoDB_Service`;

    let output = await I.verifyCommand(command, responseMessage, 'fail');

    assert.ok(output.includes(responseMessage), `The ${command} was supposed to return output which contained ${responseMessage} but actually got ${output}`);

    responseMessage = 'Connection check failed: server selection error: server selection timeout, current topology:';
    command = `docker exec ${container} pmm-admin add mongodb --tls --authentication-mechanism=MONGODB-X509 --authentication-database=$external --tls-certificate-key-file=/nodes/certificates/client.pem TLS_MongoDB_Service`;

    output = await I.verifyCommand(command, responseMessage, 'fail');

    assert.ok(output.includes(responseMessage), `The ${command} was supposed to return output which contained ${responseMessage} but actually got ${output}`);
  },
).retry(1);

Data(instances).Scenario(
  'Verify dashboard after MongoDB SSL Instances are added @ssl @ssl-remote @not-ui-pipeline',
  async ({
    I, dashboardPage, adminPage, current,
  }) => {
    const {
      serviceName,
    } = current;

    const serviceList = [serviceName, `remote_${serviceName}`];

    for (const service of serviceList) {
      I.amOnPage(dashboardPage.mongoDbInstanceOverview.url);
      dashboardPage.waitForDashboardOpened();
      await adminPage.applyTimeRange('Last 5 minutes');
      await dashboardPage.applyFilter('Service Name', service);
      adminPage.performPageDown(5);
      await dashboardPage.expandEachDashboardRow();
      adminPage.performPageUp(5);
      await dashboardPage.verifyThereAreNoGraphsWithNA();
      await dashboardPage.verifyThereAreNoGraphsWithoutData(3);
    }
  },
).retry(1);

Data(instances).Scenario(
  'Verify QAN after MongoDB SSL Instances is added @ssl @ssl-remote @not-ui-pipeline',
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
  'PMM-T1276 (1.0) Verify tlsCa, tlsCert, tlsKey are generated on every MongoDB exporter (added with TLS flags) restart @ssl @ssl-remote @not-ui-pipeline',
  async ({
    I, current, dashboardPage,
  }) => {
    const {
      container,
    } = current;

    I.amOnPage(dashboardPage.mySQLInstanceOverview.url);

    const agent_id = await I.verifyCommand(`docker exec ${container} pmm-admin list | grep mongodb_exporter | awk -F" " '{print $4}' | awk -F"/" '{print $3}'`);

    await I.verifyCommand(`docker exec ${container} ls -la /tmp/mongodb_exporter/agent_id/${agent_id}/ | grep caFile`);
    await I.verifyCommand(`docker exec ${container} rm -r /tmp/mongodb_exporter/`);
    await I.verifyCommand(`docker exec ${container} ls -la /tmp/mongodb_exporter/`, 'ls: cannot access \'/tmp/mongodb_exporter\': No such file or directory', 'fail');
    await I.verifyCommand(`docker exec ${container} pmm-admin list | grep mongodb_exporter | grep Running`);
    await I.verifyCommand(`docker exec ${container} pkill -f mongodb_exporter`);
    I.wait(10);
    await I.verifyCommand(`docker exec ${container} pmm-admin list | grep mongodb_exporter | grep Running`);
    await I.verifyCommand(`docker exec ${container} ls -la /tmp/mongodb_exporter/agent_id/${agent_id}/ | grep caFile`);
  },
).retry(1);

Data(instances).Scenario(
  'PMM-T1280, PMM-T1289'
  + ' Verify that pmm-admin inventory add agent mongodb-exporter with --log-level flag adds MongoDB exporter with corresponding log-level'
  + ' Verify that pmm-admin inventory add agent mongodb-exporter without --log-level flag adds MongoDB exporter with log-level=warn @nazarov',
  async ({
    current, cliHelper,
  }) => {
    const {
      version,
      container,
    } = current;

    const agentName = 'mongodb-exporter';

    for (const logLevel of logLevels) {
      await cliHelper.setupAndVerifyAgent(dbName, version, dbPort, container, agentName, agentFlags, logLevel);
    }
  },
).retry(1);

Data(instances).Scenario(
  'PMM-T1284, PMM-T1294'
  + ' Verify that pmm-admin inventory add agent qan-mongodb-profiler-agent with --log-level flag adds QAN MongoDB Profiler Agent with corresponding log-level'
  + ' Verify that pmm-admin inventory add agent qan-mongodb-profiler-agent without --log-level flag adds QAN MongoDB Profiler Agent with log-level=warn @nazarov',
  async ({
    I, current, cliHelper, qanPage,
  }) => {
    const {
      version,
      container,
    } = current;

    const agentName = 'qan-mongodb-profiler-agent';

    for (const logLevel of logLevels) {
      const serviceName = await cliHelper
        .setupAndVerifyAgent(dbName, version, dbPort, container, agentName, agentFlags, logLevel);

      I.amOnPage(qanPage.url);
      await qanPage.verifyServicePresentInQAN(serviceName);
    }
  },
).retry(1);
