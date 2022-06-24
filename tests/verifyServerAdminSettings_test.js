Feature('PMM Server Admin Settings');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario('PMM-T1110 - Verify Grafana using Postgres database @settings @imp',
  async ({ pmmServerAdminSettingsPage }) => {
    pmmServerAdminSettingsPage.open();
    // TODO: change expected type when PMM-4466 will be merged
    await pmmServerAdminSettingsPage.verifyDatabaseType('sqlite3');
  });
