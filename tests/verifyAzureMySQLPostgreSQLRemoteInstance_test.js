const assert = require('assert');

Feature('Monitoring Azure MySQL and PostgreSQL DB');

Before(async ({ I, settingsAPI, pmmSettingsPage }) => {
  I.Authorize();
  await settingsAPI.restoreSettingsDefaults();
  I.amOnPage(pmmSettingsPage.url);
});

Scenario(
  'PMM-T746 - Verify adding monitoring for Azure MySQL, PMM-T744 @instances',
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
  'PMM-T748 - Verify adding monitoring for Azure PostgreSQL @instances',
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
  'PMM-T747 - Verify enabling Azure flag @instances',
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
  'PMM-T756 - Verify Azure node is displayed on Home dashboard @instances',
  async ({
    I, homePage, dashboardPage,
  }) => {
    const mySQL = 'azure-MySQL';

    I.amOnPage(homePage.url);
    dashboardPage.applyFilter('Node Name', mySQL);
    homePage.verifyVisibleService(mySQL);
    // part without RDS MySQL should be skipped for now
  },
);

Scenario('PMM-T746 - Verify adding monitoring for Azure MySQL CHECK QAN @instances', async ({
  I, qanFilters, remoteInstancesPage, qanOverview, qanPage,
}) => {
  I.amOnPage(qanPage.url);
  qanFilters.applyFilter(remoteInstancesPage.mysqlAzureInputs.environment);
  qanOverview.waitForOverviewLoaded();
  const count = await qanOverview.getCountOfItems();

  assert.ok(count > 0, 'The queries for added Azure MySQL do NOT exist');
}).retry(2);

Scenario('PMM-T748 - Verify adding monitoring for Azure PostgreSQL CHECK QAN @instances', async ({
  I, qanFilters, remoteInstancesPage, qanOverview, qanPage,
}) => {
  I.amOnPage(qanPage.url);
  qanFilters.applyFilter(remoteInstancesPage.postgresqlAzureInputs.environment);
  qanOverview.waitForOverviewLoaded();
  const count = await qanOverview.getCountOfItems();

  assert.ok(count > 0, 'The queries for added Azure PostgreSQL do NOT exist');
}).retry(2);
