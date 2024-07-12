const assert = require('assert');

const noSslCheckServiceName = 'pg_no_ssl_check';

Feature('Monitoring SSL/TLS PGSQL instances');

BeforeSuite(async ({ I, adminPage }) => {
//   // await I.verifyCommand(`${pmmFrameworkLoader} --pdpgsql-version=11 --setup-postgres-ssl --pmm2`);
//   // await I.verifyCommand(`${pmmFrameworkLoader} --pdpgsql-version=12 --setup-postgres-ssl --pmm2`);
//   // await I.verifyCommand(`${pmmFrameworkLoader} --pdpgsql-version=13 --setup-postgres-ssl --pmm2`);
//   // await I.verifyCommand('python3 -m venv virtenv');
//   await I.verifyCommand('. virtenv/bin/activate');
//   await I.verifyCommand(`python ${adminPage.pathToFramework} --database SSL_PDPGSQL=14`);
});

// AfterSuite(async ({ I }) => {
  // await I.verifyCommand('docker stop pgsql_11 || docker rm pgsql_11');
  // await I.verifyCommand('docker stop pgsql_12 || docker rm pgsql_12');
  // await I.verifyCommand('docker stop pgsql_13 || docker rm pgsql_13');
  // await I.verifyCommand('docker stop pgsql_14 || docker rm pgsql_14');
// });

Before(async ({ I, settingsAPI }) => {
  await I.Authorize();
});

const instances = new DataTable(['serviceName', 'version', 'container', 'serviceType', 'metric', 'maxQueryLength']);

instances.add(['pgsql_16_ssl_service', '16', 'pdpgsql_pgsm_ssl_16', 'postgres_ssl', 'pg_stat_database_xact_rollback', '7']);
// instances.add(['pgsql_14_ssl_service', '14', 'pdpgsql_pgsm_ssl_14', 'postgres_ssl', 'pg_stat_database_xact_rollback', '7']);
// skipping this due to bug in setup due to repo and packages
// instances.add(['pgsql_12_ssl_service', '12', 'pgsql_12', 'postgres_ssl', 'pg_stat_database_xact_rollback']);
// instances.add(['pgsql_11_ssl_service', '11', 'pgsql_11', 'postgres_ssl', 'pg_stat_database_xact_rollback']);
// instances.add(['pgsql_13_ssl_service', '13', 'pgsql_13', 'postgres_ssl', 'pg_stat_database_xact_rollback']);

Data(instances).Scenario(
  'PMM-T948 PMM-T947 Verify Adding SSL services remotely @ssl @ssl-postgres @ssl-remote @not-ui-pipeline',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, current, inventoryAPI,
  }) => {
    const {
      serviceName, serviceType, version, container,
    } = current;
    let details;
    const remoteServiceName = `remote_${serviceName}`;

    console.log(`Remote service name is: ${remoteServiceName}`);

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
        tlsCA: await I.verifyCommand(`docker exec ${container} cat certificates/ca.crt`),
        tlsKey: await I.verifyCommand(`docker exec ${container} cat certificates/client.pem`),
        tlsCert: await I.verifyCommand(`docker exec ${container} cat certificates/client.crt`),
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
      remoteServiceName,
    );

    // Check Remote Instance also added and have running status
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(remoteServiceName);
    // await pmmInventoryPage.verifyAgentHasStatusRunning(remoteServiceName);
  },
);

Data(instances).Scenario(
  'PMM-T1859 Verify adding PG with --tls-skip-verify option @ssl @ssl-postgres @ssl-remote @not-ui-pipeline',
  async ({
    I, current, grafanaAPI,
  }) => {
    const {
      container,
    } = current;

    console.log(`Current container name is: ${container}`);

    // Verify user is able to add service with --tls-skip-verify option
    const responseMessage = 'PostgreSQL Service added.';
    const command = `docker exec ${container} pmm-admin add postgresql --username=pmm --password=pmm --query-source="pgstatements" --tls --tls-skip-verify ${noSslCheckServiceName}`;

    await I.verifyCommand(command, responseMessage);
  },
);

Data(instances).Scenario(
  'Verify metrics from SSL instances on PMM-Server @ssl @ssl-postgres @ssl-remote @not-ui-pipeline',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, current, grafanaAPI,
  }) => {
    const {
      serviceName, metric, container,
    } = current;
    let response;
    let result;
    const remoteServiceName = `remote_${serviceName}`;

    // Waiting for metrics to start hitting for remotely added services
    I.wait(10);

    // verify metric for client container node instance
    const localServiceName = await I.verifyCommand(`docker exec ${container} pmm-admin list | grep "PostgreSQL" | grep "ssl_service" | awk -F " " '{print $2}'`);

    console.log(`Local Service name is: ${localServiceName}`);
    console.log(await I.verifyCommand(`docker exec ${container} pmm-admin list`));

    response = await grafanaAPI.checkMetricExist(metric, { type: 'service_name', value: localServiceName });

    console.log(response.data);

    result = JSON.stringify(response.data.data.result);

    assert.ok(response.data.data.result.length !== 0, `Metrics ${metric} from ${serviceName} should be available but got empty ${result}`);

    // verify metric for remote instance
    response = await grafanaAPI.checkMetricExist(metric, { type: 'service_name', value: remoteServiceName });
    result = JSON.stringify(response.data.data.result);

    assert.ok(response.data.data.result.length !== 0, `Metrics ${metric} from ${remoteServiceName} should be available but got empty ${result}`);
  },
).retry(1);

Data(instances).Scenario(
  'PMM-T946 Verify adding PostgreSQL with --tls flag and with missing TLS options @ssl @ssl-remote @ssl-postgres @not-ui-pipeline',
  async ({
    I, current, grafanaAPI, dashboardPage,
  }) => {
    const {
      container,
    } = current;

    I.amOnPage(dashboardPage.postgresqlInstanceOverviewDashboard.url);

    let responseMessage = 'Connection check failed: stat /root/.postgresql/postgresql.key: no such file or directory.';
    let command = `docker exec ${container} pmm-admin add postgresql --tls --tls-ca-file=./certificates/ca.crt --tls-cert-file=./certificates/client.crt --query-source="pgstatements" --port=5432 --username=pmm --password=pmm --service-name=PG_tls`;

    let output = await I.verifyCommand(command, responseMessage, 'fail');

    assert.ok(output.trim() === responseMessage.trim(), `The ${command} was supposed to return ${responseMessage} but actually got ${output}`);

    responseMessage = 'PostgreSQL Service added.';
    command = `docker exec ${container} pmm-admin add postgresql --tls --tls-ca-file=./certificates/ca.crt --tls-key-file=./certificates/client.pem --port=5432 --query-source="pgstatements" --username=pmm --password=pmm --service-name=PG_tls_1`;

    await I.verifyCommand(command, responseMessage);

    responseMessage = 'Connection check failed: x509: certificate signed by unknown authority.';
    command = `docker exec ${container} pmm-admin add postgresql --tls --tls-cert-file=./certificates/client.crt --tls-key-file=./certificates/client.pem --query-source="pgstatements" --port=5432 --username=pmm --password=pmm --service-name=PG_tls`;

    output = await I.verifyCommand(command, responseMessage, 'fail');

    assert.ok(output.trim() === responseMessage.trim(), `The ${command} was supposed to return ${responseMessage} but actually got ${output}`);

    responseMessage = 'Connection check failed: x509: certificate signed by unknown authority.';
    command = `docker exec ${container} pmm-admin add postgresql --tls --query-source="pgstatements" --port=5432 --username=pmm --password=pmm --service-name=PG_tls_2`;

    output = await I.verifyCommand(command, responseMessage, 'fail');

    assert.ok(output.trim() === responseMessage.trim(), `The ${command} was supposed to return ${responseMessage} but actually got ${output}`);
  },
).retry(1);

Data(instances).Scenario(
  'Verify dashboard after PGSQL SSL Instances are added @ssl @ssl-remote @ssl-postgres @not-ui-pipeline',
  async ({
    I, dashboardPage, adminPage, current,
  }) => {
    const {
      serviceName,
    } = current;

    const serviceList = [serviceName, `remote_${serviceName}`, noSslCheckServiceName];

    for (const service of serviceList) {
      I.amOnPage(dashboardPage.postgresqlInstanceOverviewDashboard.url);
      dashboardPage.waitForDashboardOpened();
      await adminPage.applyTimeRange('Last 5 minutes');
      await dashboardPage.applyFilter('Service Name', service);
      adminPage.performPageDown(5);
      await dashboardPage.expandEachDashboardRow();
      adminPage.performPageUp(5);
      await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
    }
  },
).retry(2);

Data(instances).Scenario(
  'Verify QAN after PGSQL SSL Instances is added @ssl @ssl-remote @ssl-postgres @not-ui-pipeline',
  async ({
    I, current, adminPage, queryAnalyticsPage,
  }) => {
    const {
      serviceName, container,
    } = current;

    const localServiceName = await I.verifyCommand(`docker exec ${container} pmm-admin list | grep "PostgreSQL" | grep "ssl_service" | awk -F " " '{print $2}'`);

    const serviceList = [localServiceName, `remote_${serviceName}`, noSslCheckServiceName];

    for (const service of serviceList) {
      I.amOnPage(I.buildUrlWithParams(queryAnalyticsPage.url, { from: 'now-5m' }));
      queryAnalyticsPage.waitForLoaded();
      await adminPage.applyTimeRange('Last 5 minutes');
      queryAnalyticsPage.waitForLoaded();
      await queryAnalyticsPage.filters.selectFilterInGroup(service, 'Service Name');
      queryAnalyticsPage.waitForLoaded();
      const count = await queryAnalyticsPage.data.getCountOfItems();

      assert.ok(count > 0, `The queries for service ${service} instance do NOT exist, check QAN Data`);
    }
  },
).retry(1);

Data(instances).Scenario(
  'PMM-T1426 Verify remote PostgreSQL can be added with specified Max Query Length @max-length @ssl @ssl-postgres @ssl-remote @not-ui-pipeline',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, inventoryAPI, current, queryAnalyticsPage,
  }) => {
    const {
      serviceName, serviceType, version, container, maxQueryLength,
    } = current;
    let details;
    const remoteServiceName = `MaxQueryLenth_remote_${serviceName}`;
    //
    // if (serviceType === 'postgres_ssl') {
    //   details = {
    //     serviceName: remoteServiceName,
    //     serviceType,
    //     port: '5432',
    //     database: 'postgres',
    //     host: container,
    //     username: 'pmm',
    //     password: 'pmm',
    //     cluster: 'pgsql_remote_cluster',
    //     environment: 'pgsql_remote_cluster',
    //     tlsCA: await I.verifyCommand(`docker exec ${container} cat certificates/ca.crt`),
    //     tlsKey: await I.verifyCommand(`docker exec ${container} cat certificates/client.pem`),
    //     tlsCert: await I.verifyCommand(`docker exec ${container} cat certificates/client.crt`),
    //   };
    // }
    //
    // I.amOnPage(remoteInstancesPage.url);
    // remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    // remoteInstancesPage.openAddRemotePage(serviceType);
    // await remoteInstancesPage.addRemoteSSLDetails(details);
    // I.fillField(remoteInstancesPage.fields.maxQueryLength, maxQueryLength);
    // I.click(remoteInstancesPage.fields.addService);
    //
    // // Check Remote Instance also added and have running status
    // pmmInventoryPage.verifyRemoteServiceIsDisplayed(remoteServiceName);
    //
    // // await pmmInventoryPage.verifyAgentHasStatusRunning(remoteServiceName);
    // // Check Remote Instance also added, have running status and have correct max_query_length option set
    //
    // await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
    //   {
    //     serviceType: 'POSTGRESQL_SERVICE',
    //     service: 'postgresql',
    //   },
    //   remoteServiceName,
    // );
    //
    // const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('POSTGRESQL_SERVICE', remoteServiceName);
    //
    // await pmmInventoryPage.openAgents(service_id);
    // if (maxQueryLength !== '') {
    //   await pmmInventoryPage.checkAgentOtherDetailsSection('Qan postgresql pgstatements agent', `max_query_length=${maxQueryLength}`);
    // } else {
    //   await pmmInventoryPage.checkAgentOtherDetailsSection('Qan postgresql pgstatements agent', `max_query_length=${maxQueryLength}`, false);
    // }
    //
    // await I.wait(70);
    // Check max visible query length is less than max_query_length option
    I.amOnPage(I.buildUrlWithParams(queryAnalyticsPage.url, { from: 'now-5m' }));
    queryAnalyticsPage.waitForLoaded();
    await queryAnalyticsPage.filters.selectFilterInGroup(remoteServiceName, 'Service Name');
    I.waitForElement(queryAnalyticsPage.data.elements.queryRows, 30);
    console.log(`Locator is: ${await queryAnalyticsPage.data.elements.queryRowValue(1)}`);
    const queryFromRow = await I.grabTextFrom(await queryAnalyticsPage.data.elements.queryRowValue(1));

    if (maxQueryLength !== '' && maxQueryLength !== '-1') {
      assert.ok(queryFromRow.length <= maxQueryLength, `Query length exceeds max length boundary equals ${queryFromRow.length} is more than ${maxQueryLength}`);
    } else {
      // 6 is chosen because it's the length of "SELECT" any query that starts with that word should be longer
      assert.ok(queryFromRow.length >= 6, `Query length is equal to ${queryFromRow.length} which is less than minimal possible length`);
      queryAnalyticsPage.data.selectRow(1);
      queryAnalyticsPage.waitForLoaded();
      queryAnalyticsPage.queryDetails.checkExamplesTab();
      queryAnalyticsPage.queryDetails.checkTab('Explain');
    }
  },
);
