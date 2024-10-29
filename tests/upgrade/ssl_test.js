const assert = require('assert');
const { SERVICE_TYPE } = require('../helper/constants');

Feature('PMM upgrade tests for ssl');

const { adminPage, dashboardPage } = inject();
const pathToPMMFramework = adminPage.pathToPMMTests;
const sslinstances = new DataTable(['serviceName', 'version', 'container', 'serviceType', 'metric', 'dashboard']);

sslinstances.add(['pgsql_16_ssl_service', '16', 'pdpgsql_pgsm_ssl_16', 'postgres_ssl', 'pg_stat_database_xact_rollback', dashboardPage.postgresqlInstanceOverviewDashboard.url]);
sslinstances.add(['mysql_8.0_ssl_service', '8.0', 'mysql_ssl_8.0', 'mysql_ssl', 'mysql_global_status_max_used_connections', dashboardPage.mySQLInstanceOverview.url]);
// sslinstances.add(['mongodb_6.0_ssl_service', '6.0', 'mongodb_6.0', 'mongodb_ssl', 'mongodb_connections', dashboardPage.mongoDbInstanceOverview.url]);

Before(async ({ I }) => {
  await I.Authorize();
});

Data(sslinstances).Scenario(
  'PMM-T948 PMM-T947 Verify Adding Postgresql, MySQL, MongoDB SSL services remotely via API before upgrade @pre-ssl-upgrade',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, current, addInstanceAPI, inventoryAPI,
  }) => {
    const {
      serviceName, serviceType, version, container,
    } = current;

    console.log(await I.verifyCommand('docker ps -a'));

    let details;
    const remoteServiceName = `remote_api_${serviceName}`;

    if (serviceType === 'postgres_ssl') {
      details = {
        serviceName: remoteServiceName,
        serviceType,
        port: '5432',
        database: 'postgres',
        address: container,
        username: 'pmm',
        password: 'pmm',
        cluster: 'pgsql_remote_cluster',
        environment: 'pgsql_remote_cluster',
        tlsCAFile: await remoteInstancesPage.getFileContent(`/srv/qa-integration/pmm_qa/tls-ssl-setup/postgres/${version}/ca.crt`),
        tlsKeyFile: await remoteInstancesPage.getFileContent(`/srv/qa-integration/pmm_qa/tls-ssl-setup/postgres/${version}/client.pem`),
        tlsCertFile: await remoteInstancesPage.getFileContent(`/srv/qa-integration/pmm_qa/tls-ssl-setup/postgres/${version}/client.crt`),
      };
      await addInstanceAPI.addPostgreSqlSSL(details);
      I.wait(5);
      await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
        {
          serviceType: SERVICE_TYPE.POSTGRESQL,
          service: 'postgresql',
        },
        remoteServiceName,
      );
    }

    if (serviceType === 'mysql_ssl') {
      details = {
        serviceName: remoteServiceName,
        serviceType,
        port: '3306',
        address: container,
        username: 'pmm',
        password: 'pmm',
        cluster: 'mysql_ssl_remote_cluster',
        environment: 'mysql_ssl_remote_cluster',
        tlsCAFile: await remoteInstancesPage.getFileContent(`/srv/qa-integration/pmm_qa/tls-ssl-setup/mysql/${version}/ca.pem`),
        tlsKeyFile: await remoteInstancesPage.getFileContent(`/srv/qa-integration/pmm_qa/tls-ssl-setup/mysql/${version}/client-key.pem`),
        tlsCertFile: await remoteInstancesPage.getFileContent(`/srv/qa-integration/pmm_qa/tls-ssl-setup/mysql/${version}/client-cert.pem`),
      };
      await addInstanceAPI.addMysqlSSL(details);
      I.wait(5);
      await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
        {
          serviceType: SERVICE_TYPE.MYSQL,
          service: 'mysql',
        },
        remoteServiceName,
      );
    }

    if (serviceType === 'mongodb_ssl') {
      details = {
        serviceName: remoteServiceName,
        serviceType,
        port: '27017',
        address: container,
        cluster: 'mongodb_ssl_remote_cluster',
        environment: 'mongodb_ssl_remote_cluster',
        tls_certificate_file_password: await remoteInstancesPage.getFileContent(`${pathToPMMFramework}tls-ssl-setup/mongodb/${version}/client.key`),
        tls_certificate_key: await remoteInstancesPage.getFileContent(`${pathToPMMFramework}tls-ssl-setup/mongodb/${version}/client.pem`),
        tls_ca: await remoteInstancesPage.getFileContent(`${pathToPMMFramework}tls-ssl-setup/mongodb/${version}/ca.crt`),
      };
      await addInstanceAPI.addMongoDBSSL(details);
      I.wait(5);
      await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
        {
          serviceType: SERVICE_TYPE.MONGODB,
          service: 'mongodb',
        },
        remoteServiceName,
      );
    }
  },
);

Data(sslinstances).Scenario(
  'Verify metrics from SSL instances on PMM-Server @post-ssl-upgrade',
  async ({
    I, current, grafanaAPI, inventoryAPI,
  }) => {
    const {
      serviceName, metric,
    } = current;
    let response; let result;
    const remoteServiceName = `remote_api_${serviceName}`;

    // Waiting for metrics to start hitting for remotely added services
    I.wait(10);

    // verify metric for client container node instance

    console.log('Services are: ');
    console.log(await inventoryAPI.apiGetServices());
    response = await grafanaAPI.checkMetricExist(metric, { type: 'service_name', value: serviceName });

    console.log('Response is: ');
    console.log(response.data);
    result = JSON.stringify(response.data.data.result);

    assert.ok(response.data.data.result.length !== 0, `Metrics ${metric} from ${serviceName} should be available but got empty ${result}`);

    // verify metric for remote instance
    response = await grafanaAPI.checkMetricExist(metric, { type: 'service_name', value: remoteServiceName });
    result = JSON.stringify(response.data.data.result);

    assert.ok(response.data.data.result.length !== 0, `Metrics ${metric} from ${remoteServiceName} should be available but got empty ${result}`);
  },
).retry(1);

Data(sslinstances).Scenario(
  'Verify dashboard for SSL Instances and services after upgrade @post-ssl-upgrade',
  async ({
    I, dashboardPage, adminPage, current,
  }) => {
    const {
      serviceName, dashboard,
    } = current;

    const serviceList = [serviceName, `remote_api_${serviceName}`];

    for (const service of serviceList) {
      I.amOnPage(dashboard);
      dashboardPage.waitForDashboardOpened();
      await adminPage.applyTimeRange('Last 5 minutes');
      await dashboardPage.applyFilter('Service Name', service);
      adminPage.performPageDown(5);
      await dashboardPage.expandEachDashboardRow();
      adminPage.performPageUp(5);
      await dashboardPage.verifyThereAreNoGraphsWithoutData(3);
    }
  },
).retry(1);

Data(sslinstances).Scenario(
  'Verify QAN after upgrade for SSL Instances added @post-ssl-upgrade',
  async ({
    I, queryAnalyticsPage, current, adminPage,
  }) => {
    const {
      serviceName,
    } = current;

    const serviceList = [serviceName, `remote_api_${serviceName}`];

    for (const service of serviceList) {
      I.amOnPage(I.buildUrlWithParams(queryAnalyticsPage.url, { from: 'now-5m' }));
      queryAnalyticsPage.waitForLoaded();
      await adminPage.applyTimeRange('Last 5 minutes');
      queryAnalyticsPage.waitForLoaded();
      await queryAnalyticsPage.filters.selectFilter(service);
      queryAnalyticsPage.waitForLoaded();
      const count = await queryAnalyticsPage.data.getCountOfItems();

      assert.ok(count > 0, `The queries for service ${service} instance do NOT exist, check QAN Data`);
    }
  },
).retry(1);
