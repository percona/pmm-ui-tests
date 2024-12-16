Feature('PMM Server Admin Settings');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1110 - Verify Grafana using Postgres database @fb-settings',
  async ({ pmmServerAdminSettingsPage }) => {
    pmmServerAdminSettingsPage.open();
    await pmmServerAdminSettingsPage.verifyDatabaseType('postgres');
  },
);
