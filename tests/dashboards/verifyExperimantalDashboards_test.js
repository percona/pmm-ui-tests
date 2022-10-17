const assert = require('assert');

Feature('Test Experimental Dashboards');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1365 Verify PostgreSQL Vacuum monitoring dashboard @nightly @dashboards @tempTest',
  async ({
    I, experimentalDashboardsPage, perconaPlatformPage,
  }) => {
    await I.amOnPage(experimentalDashboardsPage.vacuumDashboardPostgres.url);
    await I.waitForVisible(experimentalDashboardsPage.elements.barValue, 60);
    const values = await I.grabTextFromAll(experimentalDashboardsPage.elements.barValue);

    values.forEach((value) => {
      const valueInt = parseInt(value.replace('%', ''), 10);

      assert.ok(valueInt > 0, 'The value for Postgres vacuum is zero, it supposed to be > 0');
    });

    const output = await I.verifyCommand('sudo docker exec pgsql_vacuum_db psql -U postgres -d dvdrental -c \'SELECT tablename FROM pg_catalog.pg_tables;\'');
    const allTables = output.split(/\r?\n/);

    await experimentalDashboardsPage.vacuumAnalyzeTables(allTables);
    await experimentalDashboardsPage.waitForLastVacuumValues(600);
    await experimentalDashboardsPage.waitForLastAnalyzeValues(600);
  },
);
