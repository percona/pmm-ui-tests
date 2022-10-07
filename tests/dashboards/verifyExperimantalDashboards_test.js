const test = 'verifyExperimantalDashboards_tests.js';

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
    // await dashboardPage.verifyThereAreNoGraphsWithoutData(0);
    const output = await I.verifyCommand('sudo docker exec pgsql_vacuum_db psql -U postgres -d dvdrental -c \'SELECT tablename FROM pg_catalog.pg_tables;\'');
    const allTables = output.split(/\r?\n/);

    allTables.forEach(async (table) => {
      if (table.includes('film_testing')) {
        console.log(`Running Vacuum analyze for table: ${table.trim()}`);
        await I.verifyCommand(`sudo docker exec pgsql_vacuum_db psql -U postgres -d dvdrental -c 'VACUUM  ( ANALYZE ) ${table.trim()}'`);
      }
    });

    // const failedReports = dashboardPage.grabFailedReportTitles();

    // console.log(failedReports);
    await I.wait(540);
    await I.refreshPage();
    await I.waitForVisible(perconaPlatformPage.perconaPlatformPage_2_26.elements.connectForm, 30);
  },
);
