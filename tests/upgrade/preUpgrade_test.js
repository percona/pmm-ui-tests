const {SERVICE_TYPE} = require("../helper/constants");

Feature('PMM server pre Upgrade Tests').retry(1);

const sslinstances = new DataTable(['serviceName', 'version', 'container', 'serviceType', 'metric', 'dashboard']);

// Unskip after https://jira.percona.com/browse/PMM-12640
// sslinstances.add(['pgsql_14_ssl_service', '14', 'pgsql_14', 'postgres_ssl', 'pg_stat_database_xact_rollback', dashboardPage.postgresqlInstanceOverviewDashboard.url]);
sslinstances.add(['mysql_8.0_ssl_service', '8.0', 'mysql_8.0', 'mysql_ssl', 'mysql_global_status_max_used_connections', dashboardPage.mySQLInstanceOverview.url]);
sslinstances.add(['mongodb_6.0_ssl_service', '6.0', 'mongodb_6.0', 'mongodb_ssl', 'mongodb_connections', dashboardPage.mongoDbInstanceOverview.url]);

Scenario(
  'Adding Redis as external Service before Upgrade @pre-external-upgrade',
  async ({
    I, addInstanceAPI,
  }) => {
    await addInstanceAPI.addExternalService('redis_external_remote');
    await I.verifyCommand(
      'pmm-admin add external --listen-port=42200 --group="redis" --custom-labels="testing=redis" --service-name="redis_external_2"',
    );
  },
);

Data(sslinstances).Scenario(
  'PMM-T948 PMM-T947 Verify Adding Postgresql, MySQL, MongoDB SSL services remotely via API before upgrade @pre-ssl-upgrade',
  async ({
           I, remoteInstancesPage, pmmInventoryPage, current, addInstanceAPI, inventoryAPI,
         }) => {
    const {
      serviceName, serviceType, version, container,
    } = current;
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
        tlsCAFile: await remoteInstancesPage.getFileContent(`${pathToPMMFramework}tls-ssl-setup/postgres/${version}/ca.crt`),
        tlsKeyFile: await remoteInstancesPage.getFileContent(`${pathToPMMFramework}tls-ssl-setup/postgres/${version}/client.pem`),
        tlsCertFile: await remoteInstancesPage.getFileContent(`${pathToPMMFramework}tls-ssl-setup/postgres/${version}/client.crt`),
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
        tlsCAFile: await remoteInstancesPage.getFileContent(`${adminPage.pathToPMMTests}tls-ssl-setup/mysql/${version}/ca.pem`),
        tlsKeyFile: await remoteInstancesPage.getFileContent(`${adminPage.pathToPMMTests}tls-ssl-setup/mysql/${version}/client-key.pem`),
        tlsCertFile: await remoteInstancesPage.getFileContent(`${adminPage.pathToPMMTests}tls-ssl-setup/mysql/${version}/client-cert.pem`),
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