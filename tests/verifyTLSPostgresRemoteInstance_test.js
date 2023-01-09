const assert = require('assert');

const { adminPage } = inject();
const pmmFrameworkLoader = `bash ${adminPage.pathToFramework}`;
const pathToPMMFramework = adminPage.pathToPMMTests;
// const pmmFrameworkLoader = '/media/sf_work/PMM/pmm-qa/pmm-tests/pmm-framework.sh';
// const pathToPMMFramework = '/media/sf_work/PMM/pmm-qa/pmm-tests/';

Feature('Monitoring SSL/TLS PGSQL instances');

const instances = new DataTable(['serviceName', 'version', 'container', 'serviceType', 'metric', 'maxQueryLength']);

instances.add(['pgsql_14_ssl_service', '14', 'pgsql_14', 'postgres_ssl', 'pg_stat_database_xact_rollback', '7']);
// skipping this due to bug in setup due to repo and packages
// instances.add(['pgsql_12_ssl_service', '12', 'pgsql_12', 'postgres_ssl', 'pg_stat_database_xact_rollback']);
// instances.add(['pgsql_11_ssl_service', '11', 'pgsql_11', 'postgres_ssl', 'pg_stat_database_xact_rollback']);
// instances.add(['pgsql_13_ssl_service', '13', 'pgsql_13', 'postgres_ssl', 'pg_stat_database_xact_rollback']);

BeforeSuite(async ({ I, codeceptjsConfig }) => {
  // await I.verifyCommand(`${pmmFrameworkLoader} --pdpgsql-version=11 --setup-postgres-ssl --pmm2`);
  // await I.verifyCommand(`${pmmFrameworkLoader} --pdpgsql-version=12 --setup-postgres-ssl --pmm2`);
  // await I.verifyCommand(`${pmmFrameworkLoader} --pdpgsql-version=13 --setup-postgres-ssl --pmm2`);
  await I.verifyCommand(`${pmmFrameworkLoader} --pdpgsql-version=14 --setup-postgres-ssl --pmm2`);
});

AfterSuite(async ({ I }) => {
  // await I.verifyCommand('docker stop pgsql_11 || docker rm pgsql_11');
  // await I.verifyCommand('docker stop pgsql_12 || docker rm pgsql_12');
  // await I.verifyCommand('docker stop pgsql_13 || docker rm pgsql_13');
  await I.verifyCommand('docker stop pgsql_14 || docker rm pgsql_14');
});

Before(async ({ I }) => {
  await I.Authorize();
});

Data(instances).Scenario(
  'New debug Max Query Length'
  + ' @max-length @ssl @ssl-remote @ssl-postgres @not-ui-pipeline',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, qanPage, qanOverview, inventoryAPI, grafanaAPI, current,
  }) => {
    const {
      serviceName, serviceType, version, container, maxQueryLength,
    } = current;
    const remoteServiceName = `remote_${serviceName}`;
    const details = {
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
      maxQueryLength: `${maxQueryLength}`,
    };

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage(serviceType);
    await remoteInstancesPage.addRemoteSSLDetails(details);
    I.click(remoteInstancesPage.fields.addService);

    // there is no message on success, ut there is on fail and need to report it
    // eslint-disable-next-line no-undef
    if (!await tryTo(() => I.waitInUrl(pmmInventoryPage.servicesUrl, 2))) {
      I.verifyPopUpMessage('success', 1);
    }

    // Base check: Service exists and running
    await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
      { serviceType: 'POSTGRESQL_SERVICE', service: 'postgresql' },
      serviceName,
    );
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
    await grafanaAPI.waitForMetric('pg_up', [{ type: 'service_name', value: remoteServiceName }], 90);
    I.amOnPage(I.buildUrlWithParams(qanPage.clearUrl, { from: 'now-5m', service_name: remoteServiceName }));
    I.refreshPage();
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
  'New debug Max Query Length 2'
  + ' @max-length @ssl @ssl-remote @ssl-postgres @not-ui-pipeline',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, qanPage, qanOverview, qanFilters, inventoryAPI, grafanaAPI, current,
  }) => {
    const {
      serviceName, serviceType, version, container, maxQueryLength,
    } = current;
    const remoteServiceName = `remote_${serviceName}`;
    const details = {
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
      maxQueryLength: `${maxQueryLength}`,
    };

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage(serviceType);
    await remoteInstancesPage.addRemoteSSLDetails(details);
    I.click(remoteInstancesPage.fields.addService);

    // there is no message on success, ut there is on fail and need to report it
    // eslint-disable-next-line no-undef
    if (!await tryTo(() => I.waitInUrl(pmmInventoryPage.servicesUrl, 2))) {
      I.verifyPopUpMessage('success', 1);
    }

    // Base check: Service exists and running
    await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
      { serviceType: 'POSTGRESQL_SERVICE', service: 'postgresql' },
      serviceName,
    );
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
    // await grafanaAPI.waitForMetric('pg_up', [{ type: 'service_name', value: remoteServiceName }], 90);
    I.amOnPage(I.buildUrlWithParams(qanPage.clearUrl, { from: 'now-5m' }));
    qanOverview.waitForOverviewLoaded();
    await qanFilters.applyFilter(remoteServiceName);
    I.waitForElement(qanOverview.elements.querySelector, 30);
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
  'PMM-T946 Verify adding PostgreSQL with --tls flag and with missing TLS options @ssl @ssl-remote @ssl-postgres @not-ui-pipeline',
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
  'Verify dashboard after PGSQL SSL Instances are added @ssl @ssl-remote @ssl-postgres @not-ui-pipeline',
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
  'Verify QAN after PGSQL SSL Instances is added @ssl @ssl-remote @ssl-postgres @not-ui-pipeline',
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
  'PMM-T1426 Verify remote PostgreSQL can be added with specified Max Query Length @max-length @ssl @ssl-postgres @ssl-remote @not-ui-pipeline',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, qanPage, qanOverview, qanFilters, qanDetails, inventoryAPI, current,
  }) => {
    const {
      serviceName, serviceType, version, container, maxQueryLength,
    } = current;
    let details;
    const remoteServiceName = `MaxQueryLenth_remote_${serviceName}`;

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
    I.fillField(remoteInstancesPage.fields.maxQueryLength, maxQueryLength);
    I.click(remoteInstancesPage.fields.addService);

    // Check Remote Instance also added and have running status
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(remoteServiceName);
    await pmmInventoryPage.verifyAgentHasStatusRunning(remoteServiceName);
    // Check Remote Instance also added and have running status
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

    if (maxQueryLength !== '' && maxQueryLength !== '-1') {
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

// Data(instances).Scenario(
//   '@PMM-T948 @PMM-T947 @PMM-T1388 @PMM-T1426 Verify remote PostgreSQL can be added with specified Max Query Length'
//   + ' @max-length @ssl @ssl-remote @not-ui-pipeline',
//   async ({
//     I, remoteInstancesPage, pmmInventoryPage, qanPage, qanOverview, qanFilters, qanDetails, inventoryAPI, current,
//   }) => {
//     const {
//       serviceName, serviceType, version, container, maxQueryLength,
//     } = current;
//     let details;
//     const remoteServiceName = `MaxQueryLenth_remote_${serviceName}`;
//
//     if (serviceType === 'postgres_ssl') {
//       details = {
//         serviceName: remoteServiceName,
//         serviceType,
//         port: '5432',
//         database: 'postgres',
//         host: container,
//         username: 'pmm',
//         password: 'pmm',
//         cluster: 'pgsql_remote_cluster',
//         environment: 'pgsql_remote_cluster',
//         tlsCAFile: `${pathToPMMFramework}tls-ssl-setup/postgres/${version}/ca.crt`,
//         tlsKeyFile: `${pathToPMMFramework}tls-ssl-setup/postgres/${version}/client.pem`,
//         tlsCertFile: `${pathToPMMFramework}tls-ssl-setup/postgres/${version}/client.crt`,
//       };
//     }
//
//     I.amOnPage(remoteInstancesPage.url);
//     remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
//     remoteInstancesPage.openAddRemotePage(serviceType);
//     await remoteInstancesPage.addRemoteSSLDetails(details);
//     I.fillField(remoteInstancesPage.fields.maxQueryLength, maxQueryLength);
//     I.click(remoteInstancesPage.fields.addService);
//
//     // Check Remote Instance also added and have running status
//     pmmInventoryPage.verifyRemoteServiceIsDisplayed(remoteServiceName);
//     await pmmInventoryPage.verifyAgentHasStatusRunning(remoteServiceName);
//
//     // Main check: correct max_query_length option displayed in Agent's details
//     if (maxQueryLength !== '') {
//       await pmmInventoryPage.checkAgentOtherDetailsSection('max_query_length:', `max_query_length: ${maxQueryLength}`, remoteServiceName, serviceId);
//     } else {
//       await pmmInventoryPage.checkAgentOtherDetailsMissing('max_query_length:', serviceId);
//     }
//
//     // Check max visible query length is less than max_query_length option
//     // Main check: Query label is cut of by max_query_length option on QAN Page
//     // I.amOnPage(I.buildUrlWithParams(qanPage.clearUrl, { from: 'now-5m', service_name: remoteServiceName, search: 'SELECT' }));
//     // I.wait(30);
//     // I.amOnPage(I.buildUrlWithParams(qanPage.clearUrl, { from: 'now-5m', service_name: remoteServiceName }));
//     // I.waitForElement(qanOverview.elements.querySelector, 30);
//     // const queryFromRow = await qanOverview.getQueryFromRow(1);
//
//     I.amOnPage(I.buildUrlWithParams(qanPage.clearUrl, { from: 'now-5m' }));
//     qanOverview.waitForOverviewLoaded();
//     await qanFilters.applyFilter(remoteServiceName);
//     I.waitForElement(qanOverview.elements.querySelector, 30);
//     const queryFromRow = await qanOverview.getQueryFromRow(1);
//
//     if (maxQueryLength !== '' && maxQueryLength !== '-1') {
//       I.assertLengthOf(queryFromRow, parseInt(maxQueryLength, 10), `Query "${queryFromRow}" length does not match expected: ${maxQueryLength}`);
//     } else {
//       // any "SELECT" query be longer then 6 without "max_query_length" option applied
//       I.assertTrue(queryFromRow.length >= 6, `Query length is equal to ${queryFromRow.length} which is less than minimal possible length`);
//     }
//   },
// );
