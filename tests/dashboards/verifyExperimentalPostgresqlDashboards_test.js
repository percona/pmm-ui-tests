const assert = require('assert');

Feature('Test PostgreSQL Experimental Dashboards');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1365 Verify PostgreSQL Vacuum monitoring dashboard @nightly @dashboards @tempTest',
  async ({
    I, experimentalPostgresqlDashboardsPage,
  }) => {
    await I.amOnPage(experimentalPostgresqlDashboardsPage.vacuumDashboardPostgres.url);
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
