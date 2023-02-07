const assert = require('assert');
const faker = require('faker');

const { adminPage } = inject();
const pmmFrameworkLoader = `bash ${adminPage.pathToFramework}`;

Feature('Monitoring SSL/TLS MYSQL instances');

const instances = new DataTable(['serviceName', 'version', 'container', 'serviceType', 'metric']);
const maxQueryLengthInstances = new DataTable(['serviceName', 'version', 'container', 'serviceType', 'metric', 'maxQueryLength']);
const maxQueryLengthTestData = new DataTable(['text']);

maxQueryLengthTestData.add(['---;']);
maxQueryLengthTestData.add(['aa']);
maxQueryLengthTestData.add(['^']);
maxQueryLengthTestData.add(['`']);
maxQueryLengthTestData.add(['"']);

instances.add(['mysql_5.7_ssl_service', '5.7', 'mysql_5.7', 'mysql_ssl', 'mysql_global_status_max_used_connections']);
instances.add(['mysql_8.0_ssl_service', '8.0', 'mysql_8.0', 'mysql_ssl', 'mysql_global_status_max_used_connections']);

maxQueryLengthInstances.add(['mysql_5.7_ssl_service', '5.7', 'mysql_5.7', 'mysql_ssl', 'mysql_global_status_max_used_connections', '10']);
maxQueryLengthInstances.add(['mysql_5.7_ssl_service', '5.7', 'mysql_5.7', 'mysql_ssl', 'mysql_global_status_max_used_connections', '-1']);
maxQueryLengthInstances.add(['mysql_5.7_ssl_service', '5.7', 'mysql_5.7', 'mysql_ssl', 'mysql_global_status_max_used_connections', '']);
maxQueryLengthInstances.add(['mysql_8.0_ssl_service', '8.0', 'mysql_8.0', 'mysql_ssl', 'mysql_global_status_max_used_connections', '10']);
maxQueryLengthInstances.add(['mysql_8.0_ssl_service', '8.0', 'mysql_8.0', 'mysql_ssl', 'mysql_global_status_max_used_connections', '-1']);
maxQueryLengthInstances.add(['mysql_8.0_ssl_service', '8.0', 'mysql_8.0', 'mysql_ssl', 'mysql_global_status_max_used_connections', '']);

BeforeSuite(async ({ I }) => {
  await I.verifyCommand(`${pmmFrameworkLoader} --ps-version=5.7 --setup-mysql-ssl --pmm2`);
  await I.verifyCommand(`${pmmFrameworkLoader} --ps-version=8.0 --setup-mysql-ssl --pmm2`);
});

AfterSuite(async ({ I }) => {
  await I.verifyCommand('docker stop mysql_5.7 || docker rm mysql_5.7');
  await I.verifyCommand('docker stop mysql_8.0 || docker rm mysql_8.0');
});

Before(async ({ I }) => {
  await I.Authorize();
});

Data(maxQueryLengthInstances).Scenario(
  '@PMM-T1402 @PMM-T1403 @PMM-T1404 - Verify adding MySQL instance via UI with specified Max Query Length option'
  + '@max-length @ssl @ssl-remote @ssl-mysql @not-ui-pipeline',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, qanPage, qanOverview, qanFilters, qanDetails, inventoryAPI, current,
  }) => {
    const {
      serviceName, serviceType, version, container, maxQueryLength,
    } = current;
    // await I.verifyCommand(`${pmmFrameworkLoader} --ps-version=${version} --setup-mysql-ssl --pmm2`);

    await I.say(await I.verifyCommand(`docker exec ${container} bash -c 'source ~/.bash_profile || true; pmm-admin list'`));

    const remoteServiceName = `remote_${serviceName}_${faker.random.alphaNumeric(3)}`;
    const details = {
      serviceName: remoteServiceName,
      serviceType,
      port: '3306',
      host: container,
      username: 'pmm',
      password: 'pmm',
      cluster: 'mysql_remote_cluster',
      environment: 'mysql_remote_cluster',
      tlsCAFile: `${adminPage.pathToPMMTests}tls-ssl-setup/mysql/${version}/ca.pem`,
      tlsKeyFile: `${adminPage.pathToPMMTests}tls-ssl-setup/mysql/${version}/client-key.pem`,
      tlsCertFile: `${adminPage.pathToPMMTests}tls-ssl-setup/mysql/${version}/client-cert.pem`,
      maxQueryLength,
    };

    // I.amOnPage(remoteInstancesPage.url);
    // remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    // remoteInstancesPage.openAddRemotePage(serviceType);
    // await remoteInstancesPage.addRemoteSSLDetails(details);
    // I.click(remoteInstancesPage.fields.addService);
    //
    // // Check Remote Instance also added and have running status
    // pmmInventoryPage.verifyRemoteServiceIsDisplayed(remoteServiceName);
    // await pmmInventoryPage.verifyAgentHasStatusRunning(remoteServiceName);
    // // Check Remote Instance also added and have running status
    // await pmmInventoryPage.openServices();
    // const serviceId = await pmmInventoryPage.getServiceId(remoteServiceName);
    //
    // // Check Remote Instance also added and have correct max_query_length option set
    // await pmmInventoryPage.openAgents();

    // there is no message on success, ut there is on fail and need to report it
    // eslint-disable-next-line no-undef
    if (!await tryTo(() => I.waitInUrl(pmmInventoryPage.servicesUrl, 2))) {
      I.verifyPopUpMessage('success', 1);
    }

    // Base check: Service exists and running
    await inventoryAPI.verifyServiceExistsAndHasRunningStatus({ serviceType: 'MYSQL_SERVICE', service: 'mysql' }, serviceName);
    I.waitForVisible(pmmInventoryPage.fields.agentsLink, 30);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(remoteServiceName);
    const serviceId = await pmmInventoryPage.getServiceId(remoteServiceName);

    await pmmInventoryPage.verifyAgentHasStatusRunning(remoteServiceName);

    // Main check: correct max_query_length option displayed in Agent's details
    if (maxQueryLength !== '') {
      await pmmInventoryPage.checkAgentOtherDetailsSection('max_query_length:', `max_query_length: ${maxQueryLength}`, remoteServiceName, serviceId);
    } else {
      await pmmInventoryPage.checkAgentOtherDetailsMissing('max_query_length:', serviceId);
    }

    // Main check: Query label is cut of by max_query_length option on QAN Page
    // I.amOnPage(I.buildUrlWithParams(qanPage.clearUrl, { from: 'now-5m', service_name: remoteServiceName, search: 'SELECT' }));
    // I.wait(30);
    // I.amOnPage(I.buildUrlWithParams(qanPage.clearUrl, { from: 'now-5m', service_name: remoteServiceName }));
    // I.waitForElement(qanOverview.elements.querySelector, 30);
    // const queryFromRow = await qanOverview.getQueryFromRow(1);
    // Check max visible query length is less than max_query_length option
    I.amOnPage(I.buildUrlWithParams(qanPage.clearUrl, { from: 'now-5m' }));
    qanOverview.waitForOverviewLoaded();
    await qanFilters.applyFilter(remoteServiceName);
    qanOverview.waitForOverviewLoaded();
    const queryFromRow = await qanOverview.getQueryFromRow(1);

    if (maxQueryLength !== '' && maxQueryLength !== '-1') {
      I.assertLengthOf(queryFromRow, parseInt(maxQueryLength, 10), `Query "${queryFromRow}" length does not match expected: ${maxQueryLength}`);
    } else {
      // any "SELECT" query be longer then 6 without "max_query_length" option applied
      I.assertTrue(queryFromRow.length >= 6, `Query length is equal to ${queryFromRow.length} which is less than minimal possible length`);
    }
  },
);

Data(instances).Scenario(
  'Verify metrics from mysql SSL instances on PMM-Server @ssl @ssl-mysql @ssl-remote @not-ui-pipeline',
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
  'PMM-T937 PMM-T938 Verify MySQL cannot be added without specified --tls-key, Verify MySQL cannot be added without specified --tls-cert @ssl @ssl-mysql @ssl-remote @not-ui-pipeline',
  async ({
    I, current, grafanaAPI, remoteInstancesPage,
  }) => {
    const {
      container,
    } = current;

    I.amOnPage(remoteInstancesPage.url);

    let responseMessage = 'Connection check failed: register MySQL client cert failed: tls: failed to find any PEM data in key input.\n';
    let command = `docker exec ${container} pmm-admin add mysql --username=pmm --password=pmm --port=3306 --query-source=perfschema --tls --tls-skip-verify --tls-ca=/var/lib/mysql/ca.pem --tls-cert=/var/lib/mysql/client-cert.pem TLS_mysql`;

    let output = await I.verifyCommand(command, responseMessage, 'fail');

    assert.ok(output === responseMessage, `The ${command} was supposed to return ${responseMessage} but actually got ${output}`);

    responseMessage = 'Connection check failed: register MySQL client cert failed: tls: failed to find any PEM data in certificate input.\n';
    command = `docker exec ${container} pmm-admin add mysql --username=pmm --password=pmm --port=3306 --query-source=perfschema --tls --tls-skip-verify --tls-ca=/var/lib/mysql/ca.pem --tls-key=/var/lib/mysql/client-key.pem TLS_mysql`;

    output = await I.verifyCommand(command, responseMessage, 'fail');

    assert.ok(output === responseMessage, `The ${command} was supposed to return ${responseMessage} but actually got ${output}`);
  },
).retry(1);

Data(instances).Scenario(
  'Verify dashboard after MySQL SSL Instances are added @ssl @ssl-mysql @ssl-remote @not-ui-pipeline',
  async ({
    I, dashboardPage, adminPage, current,
  }) => {
    const {
      serviceName,
    } = current;

    const serviceList = [serviceName, `remote_${serviceName}`];

    for (const service of serviceList) {
      I.amOnPage(dashboardPage.mySQLInstanceOverview.url);
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
  'Verify QAN after MySQL SSL Instances is added @ssl @ssl-mysql @ssl-remote @not-ui-pipeline',
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
  'PMM-T1277 (1.0) Verify tlsCa, tlsCert, tlsKey are generated on every MySQL exporter (added with TLS flags) restart @ssl-mysql @ssl @ssl-remote @not-ui-pipeline',
  async ({
    I, current, dashboardPage,
  }) => {
    const {
      container,
    } = current;

    I.amOnPage(dashboardPage.mySQLInstanceOverview.url);

    const agent_id = await I.verifyCommand(`docker exec ${container} pmm-admin list | grep mysqld_exporter | awk -F" " '{print $4}' | awk -F"/" '{print $3}'`);

    await I.verifyCommand(`docker exec ${container} ls -la /tmp/mysqld_exporter/agent_id/${agent_id}/ | grep tls`);
    await I.verifyCommand(`docker exec ${container} rm -r /tmp/mysqld_exporter/`);
    await I.verifyCommand(`docker exec ${container} ls -la /tmp/mysqld_exporter/`, 'ls: cannot access \'/tmp/mysqld_exporter\': No such file or directory', 'fail');
    await I.verifyCommand(`docker exec ${container} pmm-admin list | grep mysqld_exporter | grep Running`);
    await I.verifyCommand(`docker exec ${container} pkill -f mysqld_exporter`);
    I.wait(10);
    await I.verifyCommand(`docker exec ${container} pmm-admin list | grep mysqld_exporter | grep Running`);
    await I.verifyCommand(`docker exec ${container} ls -la /tmp/mysqld_exporter/agent_id/${agent_id}/ | grep tls`);
  },
).retry(1);

Data(maxQueryLengthTestData).Scenario(
  'PMM-T1405 Verify validation of Max Query Length option on Add remote MySQL page @max-length @ssl @ssl-mysql @ssl-remote @not-ui-pipeline',
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
