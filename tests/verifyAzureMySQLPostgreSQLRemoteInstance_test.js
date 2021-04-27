Feature('Monitoring Azure MySQL and PostgreSQL DB');

Before(async ({ I, settingsAPI, pmmSettingsPage }) => {
  I.Authorize();
  await settingsAPI.restoreSettingsDefaults();
  I.amOnPage(pmmSettingsPage.url);
});

Scenario(
  'PMM-T746 - Verify adding monitoring for Azure MySQL, PMM-T744 Verify there is "Add Azure MySQL or PostgreSQL instance" button on "Add Instance" page @not-ui-pipeline',
  async ({ I, pmmSettingsPage, remoteInstancesPage }) => {
    const sectionNameToExpand = pmmSettingsPage.sectionTabsList.advanced;

    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    await pmmSettingsPage.expandSection(sectionNameToExpand, pmmSettingsPage.fields.advancedButton);
    I.waitForVisible(pmmSettingsPage.fields.microsoftAzureMonitoringSwitch, 30);
    I.click(pmmSettingsPage.fields.microsoftAzureMonitoringSwitch);
    I.waitForVisible(pmmSettingsPage.fields.advancedButton, 30);
    I.click(pmmSettingsPage.fields.advancedButton);
    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.openAndAzure();
    remoteInstancesPage.discoverAzure();
    remoteInstancesPage.startMonitoringOfInstance('pmm2-qa-mysql');
    remoteInstancesPage.verifyAddInstancePageOpened();
  },
);
