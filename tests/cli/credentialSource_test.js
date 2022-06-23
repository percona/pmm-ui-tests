const assert = require('assert');

const {
  dashboardPage,
} = inject();

const dbInstances = new DataTable(['service', 'serviceName', 'serviceType', 'metric', 'dashboard', 'credentialFile', 'port']);

dbInstances.add(['mysql', 'credential_source_mysql', 'MYSQL_SERVICE', 'mysql_global_status_max_used_connections', dashboardPage.mySQLInstanceOverview.url, './tests/cli/credentialSourceData/mysql/mysqlConnectionString.json', '3309']);
dbInstances.add(['postgresql', 'credential_source_postgres', 'POSTGRESQL_SERVICE', 'pg_stat_database_xact_rollback', dashboardPage.postgresqlInstanceOverviewDashboard.url, './tests/cli/credentialSourceData/postgres/postgresConnectionString.json', '5433']);
dbInstances.add(['mongodb', 'credential_source_mongodb', 'MONGODB_SERVICE', 'mongodb_connections', dashboardPage.mongoDbInstanceOverview.url, './tests/cli/credentialSourceData/mongodb/mongodbConnectionString.json', '27017']);
dbInstances.add(['proxysql', 'credential_source_proxysql', 'PROXYSQL_SERVICE', 'proxysql_up', dashboardPage.proxysqlInstanceSummaryDashboard.url, './tests/cli/credentialSourceData/proxysql/proxysqlConnectionString.json', '6032']);

Feature('PMM Admin Credential Source Flag tests').retry(0);

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1229 Verify pmm-admin add --credentials-source flag overwrites other credentials @not-ui-pipeline @cli @exporters',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    const mysql_service_name = 'credential_source_mysql';

    if (await inventoryAPI.checkServiceExist(mysql_service_name, 'MYSQL_SERVICE')) {
      await I.say(await I.verifyCommand(`pmm-admin remove mysql ${mysql_service_name}`));
    }

    await I.say(await I.verifyCommand(`pmm-admin add mysql --username=testing --password=wrong_password --port=3309 --host=127.0.0.1 --query-source=perfschema --agent-password=testing --credentials-source=./tests/cli/credentialSourceData/mysql/mysqlConnectionString.json ${mysql_service_name}`));

    I.say('Wait 60 seconds for Metrics being collected for the new service');
    await I.wait(60);
    await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
      {
        serviceType: 'MYSQL_SERVICE',
        service: 'mysql',
      },
      mysql_service_name,
    );
    await grafanaAPI.checkMetricExist('mysql_global_status_max_used_connections', { type: 'service_name', value: mysql_service_name });
    await grafanaAPI.checkMetricExist('mysql_up', { type: 'service_name', value: mysql_service_name });
  },
);

Data(dbInstances).Scenario(
  'PMM-T1230 Verify pmm-admin add with --credentials-source flag @not-ui-pipeline @cli @exporters',
  async ({
    I, inventoryAPI, grafanaAPI, current,
  }) => {
    const {
      service, serviceName, serviceType, metric, credentialFile, port,
    } = current;
    let querySource;

    switch (service) {
      case 'mysql':
        querySource = '--query-source=perfschema';
        break;
      case 'postgresql':
        querySource = '--query-source=pgstatements';
        break;
      case 'mongodb':
        querySource = '--query-source=profiler';
        break;
      default:
        querySource = '';
    }

    if (await inventoryAPI.checkServiceExist(serviceName, serviceType)) {
      await I.say(await I.verifyCommand(`pmm-admin remove ${service} ${serviceName}`));
    }

    await I.say(await I.verifyCommand(`pmm-admin add ${service} --port=${port} --host=127.0.0.1 ${querySource} --credentials-source=${credentialFile} ${serviceName}`));

    I.say('Wait 60 seconds for Metrics being collected for the new service');
    await I.wait(60);
    await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
      {
        serviceType,
        service,
      },
      serviceName,
    );
    await grafanaAPI.checkMetricExist(metric, { type: 'service_name', value: serviceName });
  },
);

Scenario(
  'PMM-T1231 Verify pmm-admin add with wrong path in --credentials-source flag @not-ui-pipeline @cli @exporters',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    const mysql_service_name = 'credential_source_mysql';

    if (await inventoryAPI.checkServiceExist(mysql_service_name, 'MYSQL_SERVICE')) {
      await I.say(await I.verifyCommand(`pmm-admin remove mysql ${mysql_service_name}`));
    }

    const output = await I.verifyCommand(`pmm-admin add mysql --username=testing --password=wrong_password --port=3309 --host=127.0.0.1 --query-source=perfschema --agent-password=testing --credentials-source=./no/bueno/mysqlConnectionString.json ${mysql_service_name}`, '', 'fail');

    assert.ok(output.trim() === 'pmm-admin: error: path \'./no/bueno/mysqlConnectionString.json\' does not exist, try --help', `Expected pmm-admin add to fail with Error Message when user provided wrong path to credential source file, got output as ${output}`);
  },
);

Scenario(
  'PMM-T1232 Verify pmm-admin add with wrong or missing credentials in file from --credentials-source flag @not-ui-pipeline @cli @exporters',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    const mysql_service_name = 'credential_source_mysql';
    let output;

    if (await inventoryAPI.checkServiceExist(mysql_service_name, 'MYSQL_SERVICE')) {
      await I.say(await I.verifyCommand(`pmm-admin remove mysql ${mysql_service_name}`));
    }

    output = await I.verifyCommand(`pmm-admin add mysql --username=testing --password=wrong_password --port=3309 --host=127.0.0.1 --query-source=perfschema --agent-password=testing --credentials-source=./tests/cli/credentialSourceData/mysql/mysqlConnectionString_missingPassword.json ${mysql_service_name}`, '', 'fail');

    assert.ok(output.trim().includes('Connection check failed: Error 1045: Access denied for user \'pmm-agent\'@'), `Expected pmm-admin add to fail with Error Message when user provided missing Password in credential source file, got output as ${output}`);

    output = await I.verifyCommand(`pmm-admin add mysql --username=testing --password=wrong_password --port=3309 --host=127.0.0.1 --query-source=perfschema --agent-password=testing --credentials-source=./tests/cli/credentialSourceData/mysql/mysqlConnectionString_missingUsername.json ${mysql_service_name}`, '', 'fail');

    assert.ok(output.trim().includes('invalid field Username: value \'\' must not be an empty string'), `Expected pmm-admin add to fail with Error Message when user provided missing username in credential source file, got output as ${output}`);

    output = await I.verifyCommand(`pmm-admin add mysql --username=testing --password=wrong_password --port=3309 --host=127.0.0.1 --query-source=perfschema --agent-password=testing --credentials-source=./tests/cli/credentialSourceData/mysql/mysqlConnectionString_missingAgentPassword.json ${mysql_service_name}`);

    I.say('Wait 60 seconds for Metrics being collected for the new service');
    await I.wait(60);
    await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
      {
        serviceType: 'MYSQL_SERVICE',
        service: 'mysql',
      },
      mysql_service_name,
    );
    await grafanaAPI.checkMetricExist('mysql_global_status_max_used_connections', { type: 'service_name', value: mysql_service_name });
    await grafanaAPI.checkMetricExist('mysql_up', { type: 'service_name', value: mysql_service_name });
  },
);

Scenario(
  'PMM-T1233 Verify pmm-admin add with --credentials-source flag and wrong file format @not-ui-pipeline @cli @exporters',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    const mysql_service_name = 'credential_source_mysql';

    if (await inventoryAPI.checkServiceExist(mysql_service_name, 'MYSQL_SERVICE')) {
      await I.say(await I.verifyCommand(`pmm-admin remove mysql ${mysql_service_name}`));
    }

    const output = await I.verifyCommand(`pmm-admin add mysql --username=testing --password=wrong_password --port=3309 --host=127.0.0.1 --query-source=perfschema --agent-password=testing --credentials-source=./tests/cli/credentialSourceData/mysql/mysqlConnectionString_invalid.json ${mysql_service_name}`, '', 'fail');

    assert.ok(output.trim().includes('failed to retrieve credentials from ./tests/cli/credentialSourceData/mysql/mysqlConnectionString_invalid.json: invalid character \':\' after top-level value'), `Expected pmm-admin add to fail with Error Message when user provided wrong path to credential source file, got output as ${output}`);
  },
);

Scenario(
  'PMM-T1234 Verify pmm-admin add with --credentials-source flag and different file permissions @not-ui-pipeline @cli @exporters',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    const mysql_service_name = 'credential_source_mysql';

    if (await inventoryAPI.checkServiceExist(mysql_service_name, 'MYSQL_SERVICE')) {
      await I.say(await I.verifyCommand(`pmm-admin remove mysql ${mysql_service_name}`));
    }

    const output = await I.verifyCommand(`pmm-admin add mysql --username=testing --password=wrong_password --port=3309 --host=127.0.0.1 --query-source=perfschema --agent-password=testing --credentials-source=./tests/cli/credentialSourceData/mysql/mysqlConnectionString_invalidPermission.json ${mysql_service_name}`, '', 'fail');

    assert.ok(output.trim().includes('failed to retrieve credentials from ./tests/cli/credentialSourceData/mysql/mysqlConnectionString_invalidPermission.json: execution is not supported: ./tests/cli/credentialSourceData/mysql/mysqlConnectionString_invalidPermission.json'), `Expected pmm-admin add to fail with Error Message when user provided wrong path to credential source file, got output as ${output}`);
  },
);
