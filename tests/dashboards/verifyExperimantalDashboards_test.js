const assert = require('assert');

Feature('Test Dashboards inside the MongoDB Folder');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1365 Verify PostgreSQL Vacuum monitoring dashboard @nightly @dashboards @tempTest',
  async ({
    I, experimentalDashboardsPage, perconaPlatformPage, dashboardPage,
  }) => {
    await I.amOnPage(experimentalDashboardsPage.vacuumDashboardPostgres.url);
    await I.waitForVisible(experimentalDashboardsPage.elements.barValue, 60)
    const values = await I.grabTextFromAll(experimentalDashboardsPage.elements.barValue);

    console.log(values);
    values.forEach((value) => {
      const valueInt = parseInt(value.replace('%', ''), 10);

      console.log(`Int Value is: ${valueInt}`);
      assert.ok(valueInt > 0, 'The value for Postgres vacuum is zero, it supposted to be > 0');
    });

    const output = await I.verifyCommand('sudo docker exec pgsql_vacuum_db psql -U postgres -d dvdrental -c \'SELECT tablename FROM pg_catalog.pg_tables;\'');
    const allTables = output.split(/\r?\n/);

    allTables.forEach(async (table) => {
      if (table.includes('film_testing')) {
        await I.verifyCommand(`sudo docker exec pgsql_vacuum_db psql -U postgres -d dvdrental -c 'VACUUM  ( ANALYZE ) ${table.trim()}'`);
      }
    });
    await I.waitForInvisible(experimentalDashboardsPage.elements.neverRunField, 600);
    await I.refreshPage();
    await I.waitForVisible(perconaPlatformPage.perconaPlatformPage_2_26.elements.connectForm, 30);
  },
);
