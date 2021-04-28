const assert = require('assert');

Feature('Monitoring Azure MySQL and PostgreSQL DB');

Before(async ({ I, settingsAPI, pmmSettingsPage }) => {
  I.Authorize();
  await settingsAPI.restoreSettingsDefaults();
  I.amOnPage(pmmSettingsPage.url);
});

Scenario(
  'PMM-T746 - Verify adding monitoring for Azure MySQL, PMM-T744 @not-pr-pipeline',
  async ({
    I, pmmSettingsPage, remoteInstancesPage, pmmInventoryPage,
  }) => {
    const sectionNameToExpand = pmmSettingsPage.sectionTabsList.advanced;
    const serviceName = 'azure-MySQL';

    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    await pmmSettingsPage.expandSection(sectionNameToExpand, pmmSettingsPage.fields.advancedButton);
    pmmSettingsPage.switchAzure();
    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.openAndAzure();
    remoteInstancesPage.discoverAzure();
    remoteInstancesPage.startMonitoringOfInstance('pmm2-qa-mysql');
    remoteInstancesPage.verifyAddInstancePageOpened();
    remoteInstancesPage.fillRemoteRDSFields(serviceName);
    I.click(remoteInstancesPage.fields.addService);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(serviceName);
    await pmmInventoryPage.verifyAgentHasStatusRunning(serviceName);
  },
);

Scenario(
  'PMM-T747 - Verify enabling Azure flag @not-pr-pipeline',
  async ({
    I, pmmSettingsPage, remoteInstancesPage,
  }) => {
    const sectionNameToExpand = pmmSettingsPage.sectionTabsList.advanced;

    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    await pmmSettingsPage.expandSection(sectionNameToExpand, pmmSettingsPage.fields.advancedButton);
    pmmSettingsPage.verifySwitch(pmmSettingsPage.fields.microsoftAzureMonitoringSwitchInput, 'off');
    I.amOnPage(remoteInstancesPage.url);
    I.waitForInvisible(remoteInstancesPage.fields.addAzureMySQLPostgreSQL, 30);
    I.amOnPage(pmmSettingsPage.url);
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    await pmmSettingsPage.expandSection(sectionNameToExpand, pmmSettingsPage.fields.advancedButton);
    pmmSettingsPage.switchAzure();
    I.amOnPage(remoteInstancesPage.url);
    I.waitForVisible(remoteInstancesPage.fields.addAzureMySQLPostgreSQL, 30);
    I.amOnPage(pmmSettingsPage.url);
    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    await pmmSettingsPage.expandSection(sectionNameToExpand, pmmSettingsPage.fields.advancedButton);
    pmmSettingsPage.switchAzure();
    I.amOnPage(remoteInstancesPage.url);
    I.waitForInvisible(remoteInstancesPage.fields.addAzureMySQLPostgreSQL, 30);
  },
);

Scenario(
  'PMM-T748 - Verify adding monitoring for Azure PostgreSQL @not-pr-pipeline',
  async ({
    I, pmmSettingsPage, remoteInstancesPage, pmmInventoryPage,
  }) => {
    const sectionNameToExpand = pmmSettingsPage.sectionTabsList.advanced;
    const serviceName = 'azure-PostgreSQL';

    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    await pmmSettingsPage.expandSection(sectionNameToExpand, pmmSettingsPage.fields.advancedButton);
    pmmSettingsPage.switchAzure();
    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.openAndAzure();
    remoteInstancesPage.discoverAzure();
    remoteInstancesPage.startMonitoringOfInstance('pmm2-qa-postgresql');
    remoteInstancesPage.verifyAddInstancePageOpened();
    remoteInstancesPage.fillRemoteRDSFields(serviceName);
    I.click(remoteInstancesPage.fields.addService);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(serviceName);
    await pmmInventoryPage.verifyAgentHasStatusRunning(serviceName);
  },
);

Scenario(
  'PMM-T756 - Verify Azure node is displayed on Home dashboard @not-pr-pipeline',
  async ({
    I, homePage, remoteInstancesPage, dashboardPage, pmmInventoryPage,
  }) => {
    const mySQL = 'azure-MySQL';
    const instanceToMonitor = 'rds-mysql56';

    I.amOnPage(homePage.url);
    dashboardPage.applyFilter('Node Name', mySQL);
    homePage.verifyVisibleService(mySQL);
    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded().openAddAWSRDSMySQLPage();
    remoteInstancesPage.discoverRDS();
    remoteInstancesPage.verifyInstanceIsDiscovered(instanceToMonitor);
    remoteInstancesPage.startMonitoringOfInstance(instanceToMonitor);
    remoteInstancesPage.verifyAddInstancePageOpened();
    remoteInstancesPage.fillRemoteRDSFields(instanceToMonitor);
    remoteInstancesPage.createRemoteInstance(instanceToMonitor);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(instanceToMonitor);
    I.amOnPage(homePage.url);
    dashboardPage.applyFilter('Node Name', mySQL);
    homePage.verifyVisibleService(mySQL);
  },
);

Scenario('PMM-T746 - Verify adding monitoring for Azure MySQL CHECK QAN @not-pr-pipeline', async ({ qanFilters, remoteInstancesPage, qanOverview }) => {
  qanFilters.applyFilter(remoteInstancesPage.mysqlAzureInputs.environment);
  qanOverview.waitForOverviewLoaded();
  const count = await qanOverview.getCountOfItems();

  assert.ok(count > 0, 'The queries for added Azure MySQL do NOT exist');
});

Scenario('PMM-T748 - Verify adding monitoring for Azure PostgreSQL CHECK QAN @not-pr-pipeline', async ({ qanFilters, remoteInstancesPage, qanOverview }) => {
  qanFilters.applyFilter(remoteInstancesPage.postgresqlAzureInputs.environment);
  qanOverview.waitForOverviewLoaded();
  const count = await qanOverview.getCountOfItems();

  assert.ok(count > 0, 'The queries for added Azure PostgreSQL do NOT exist');
});
