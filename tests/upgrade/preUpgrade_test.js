const { SERVICE_TYPE } = require('../helper/constants');

Feature('PMM server pre Upgrade Tests').retry(1);

const { adminPage, dashboardPage } = inject();

const sslinstances = new DataTable(['serviceName', 'version', 'container', 'serviceType', 'metric', 'dashboard']);

// Unskip after https://jira.percona.com/browse/PMM-12640
// sslinstances.add(['pgsql_14_ssl_service', '14', 'pgsql_14', 'postgres_ssl', 'pg_stat_database_xact_rollback', dashboardPage.postgresqlInstanceOverviewDashboard.url]);
sslinstances.add(['mysql_8.0_ssl_service', '8.0', 'mysql_8.0', 'mysql_ssl', 'mysql_global_status_max_used_connections', dashboardPage.mySQLInstanceOverview.url]);
sslinstances.add(['mongodb_6.0_ssl_service', '6.0', 'mongodb_6.0', 'mongodb_ssl', 'mongodb_connections', dashboardPage.mongoDbInstanceOverview.url]);

const clientDbServices = new DataTable(['serviceType', 'name', 'metric', 'annotationName', 'dashboard', 'upgrade_service']);

clientDbServices.add([SERVICE_TYPE.MYSQL, 'ps_', 'mysql_global_status_max_used_connections', 'annotation-for-mysql', dashboardPage.mysqlInstanceSummaryDashboard.url, 'mysql_upgrade']);
clientDbServices.add([SERVICE_TYPE.POSTGRESQL, 'PGSQL_', 'pg_stat_database_xact_rollback', 'annotation-for-postgres', dashboardPage.postgresqlInstanceSummaryDashboard.url, 'pgsql_upgrade']);
clientDbServices.add([SERVICE_TYPE.MONGODB, 'mongodb_', 'mongodb_connections', 'annotation-for-mongo', dashboardPage.mongoDbInstanceSummaryDashboard.url, 'mongo_upgrade']);

Data(clientDbServices).Scenario(
  'Adding custom agent Password, Custom Label before upgrade At service Level @pre-custom-password-upgrade',
  async ({
    I, inventoryAPI, current,
  }) => {
    const {
      serviceType, name, upgrade_service,
    } = current;
    const {
      service_id, node_id, address, port,
    } = await inventoryAPI.apiGetNodeInfoByServiceName(serviceType, name);

    const { agent_id: pmm_agent_id } = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);
    let output;

    switch (serviceType) {
      case SERVICE_TYPE.MYSQL:
        output = await I.verifyCommand(
          `pmm-admin add mysql --node-id=${node_id} --pmm-agent-id=${pmm_agent_id} --port=${port} --password=GRgrO9301RuF --host=${address} --query-source=perfschema --agent-password=uitests --custom-labels="testing=upgrade" ${upgrade_service}`,
        );
        break;
      case SERVICE_TYPE.POSTGRESQL:
        output = await I.verifyCommand(
          `pmm-admin add postgresql --username=postgres --password=oFukiBRg7GujAJXq3tmd --node-id=${node_id} --pmm-agent-id=${pmm_agent_id} --port=${port} --host=${address} --agent-password=uitests --custom-labels="testing=upgrade" ${upgrade_service}`,
        );
        break;
      case SERVICE_TYPE.MONGODB:
        output = await I.verifyCommand(
          `pmm-admin add mongodb --username=pmm_mongodb --password=GRgrO9301RuF --port=27023 --host=${address} --agent-password=uitests --custom-labels="testing=upgrade" ${upgrade_service}`,
        );
        break;
      default:
    }
  },
);

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
