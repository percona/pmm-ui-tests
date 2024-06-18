Feature('PMM Server Role Based Access Control (RBAC)');

Before(async ({ I, pmmSettingsPage }) => {
  await I.Authorize();
  I.amOnPage(pmmSettingsPage.advancedSettingsUrl);
});

Scenario(
  'PMM-T1899 - Access Role based on Labels and Check Filtering of Metrics on Dashboard @settings',
  async ({ pmmSettingsPage }) => {
    await pmmSettingsPage.enableRBAC();
  },
);
