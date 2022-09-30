const test = 'verifyExperimantalDashboards_tests.js';

Feature('Test Dashboards inside the MongoDB Folder');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1365 Verify PostgreSQL Vacuum monitoring dashboard @nightly @dashboards @tempTest',
  async ({ I, experimentalDashboardsPage }) => {
    await I.amOnPage(experimentalDashboardsPage.vacuumDashboardPostgres.url);
    await I.wait(180);
  },
);
