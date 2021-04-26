Feature('Monitoring Azure MySQL and PostgreSQL DB');

Before(async ({ I, settingsAPI, pmmSettingsPage }) => {
  I.Authorize();
  await settingsAPI.restoreSettingsDefaults();
  I.amOnPage(pmmSettingsPage.url);
});

Scenario(
  'PMM-T747 - Verify enabling Azure flag @not-ui-pipeline',
  async ({ I, pmmSettingsPage, remoteInstancesPage }) => {
    const sectionNameToExpand = pmmSettingsPage.sectionTabsList.advanced;

    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    await pmmSettingsPage.expandSection(sectionNameToExpand, pmmSettingsPage.fields.advancedButton);
    I.waitForVisible(pmmSettingsPage.fields.microsoftAzureMonitoringSwitch, 30);
    I.click(pmmSettingsPage.fields.microsoftAzureMonitoringSwitch);
    I.waitForVisible(pmmSettingsPage.fields.advancedButton, 30);
    I.click(pmmSettingsPage.fields.advancedButton);
    I.amOnPage(remoteInstancesPage.url);
    I.waitForVisible(remoteInstancesPage.fields.addAzureMySQLPostgreSQL, 30);
    I.click(remoteInstancesPage.fields.addAzureMySQLPostgreSQL);
  },
);
