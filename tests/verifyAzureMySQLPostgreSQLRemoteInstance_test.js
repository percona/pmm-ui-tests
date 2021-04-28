Feature('Monitoring Azure MySQL and PostgreSQL DB');

Before(async ({ I, settingsAPI, pmmSettingsPage }) => {
  I.Authorize();
  await settingsAPI.restoreSettingsDefaults();
  I.amOnPage(pmmSettingsPage.url);
});

Scenario(
  'PMM-T746 - Verify adding monitoring for Azure MySQL, PMM-T744 Verify there is "Add Azure MySQL or PostgreSQL instance" button on "Add Instance" page @not-pr-pipeline',
  async ({
    I, pmmSettingsPage, remoteInstancesPage, pmmInventoryPage,
  }) => {
    const sectionNameToExpand = pmmSettingsPage.sectionTabsList.advanced;
    const serviceName = 'azure-MySQL';

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
    remoteInstancesPage.fillRemoteRDSFields(serviceName);
    I.click(remoteInstancesPage.fields.addService);
    I.amOnPage(pmmInventoryPage.url);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(serviceName);
    await pmmInventoryPage.verifyAgentHasStatusRunning(serviceName);
  },
);
