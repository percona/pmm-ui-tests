const assert = require('assert');

Feature('Test PostgreSQL Experimental Dashboards');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1365 Verify PostgreSQL Vacuum monitoring dashboard @dashboards @experimental',
  async ({
    I, experimentalPostgresqlDashboardsPage,
  }) => {
    const pgsqlContainerName = await I.verifyCommand('docker ps -f name=pgsql --format "{{ .Names }}"');

    await I.verifyCommand(`docker exec ${pgsqlContainerName} apt-get update`);
    await I.verifyCommand(`docker exec ${pgsqlContainerName} apt-get install -y wget unzip`);
    await I.verifyCommand(`docker exec ${pgsqlContainerName} wget https://www.postgresqltutorial.com/wp-content/uploads/2019/05/dvdrental.zip`);
    await I.verifyCommand(`docker exec ${pgsqlContainerName} unzip dvdrental.zip`);
    await I.verifyCommand(`docker exec ${pgsqlContainerName} psql -U postgres -c "CREATE EXTENSION pg_stat_statements;"`);
    await I.verifyCommand(`docker exec ${pgsqlContainerName} psql -U postgres -c 'create database dvdrental;'`);
    await I.verifyCommand(`docker exec ${pgsqlContainerName} pg_restore -U postgres -d dvdrental dvdrental.tar`);

    await I.amOnPage(experimentalPostgresqlDashboardsPage.vacuumDashboardPostgres.url);
    await experimentalPostgresqlDashboardsPage.selectServiceName('pgsql_vacuum_db');
    await I.waitForVisible(experimentalPostgresqlDashboardsPage.elements.barValue, 60);
    const values = await I.grabTextFromAll(experimentalPostgresqlDashboardsPage.elements.barValue);

    values.forEach((value) => {
      const valueInt = parseInt(value.replace('%', ''), 10);

      I.assertAbove(valueInt, 0, 'The value for Postgres vacuum is zero, it supposed to be > 0');
    });

    const output = await I.verifyCommand('sudo docker exec pgsql_vacuum_db psql -U postgres -d dvdrental -c \'SELECT tablename FROM pg_catalog.pg_tables;\'');
    const allTables = output.split(/\r?\n/);

    await experimentalPostgresqlDashboardsPage.vacuumAnalyzeTables(allTables);
    await experimentalPostgresqlDashboardsPage.waitForLastVacuumValues(600);
    await experimentalPostgresqlDashboardsPage.waitForLastAnalyzeValues(600);
  },
);
