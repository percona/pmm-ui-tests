const assert = require('assert');

const { remoteInstancesPage } = inject();

const filters = new DataTable(['filter']);
const azureServices = new DataTable(['serviceName', 'instanceToMonitor']);

filters.add([remoteInstancesPage.mysqlAzureInputs.environment]);
filters.add([remoteInstancesPage.postgresqlAzureInputs.environment]);
azureServices.add(['azure-MySQL', 'pmm2-qa-mysql']);
azureServices.add(['azure-PostgreSQL', 'pmm2-qa-postgresql']);

Feature('Monitoring Azure MySQL and PostgreSQL DB');

Before(async ({ I, settingsAPI, pmmSettingsPage }) => {
  await I.Authorize();
  await settingsAPI.restoreSettingsDefaults();
  I.amOnPage(pmmSettingsPage.url);
});

Data(azureServices).Scenario(
  'PMM-T744, PMM-T746, PMM-T748 - Verify adding monitoring for Azure @instances',
  async ({
    I, pmmSettingsPage, remoteInstancesPage, pmmInventoryPage, current,
  }) => {
    const sectionNameToExpand = pmmSettingsPage.sectionTabsList.advanced;
    const { serviceName } = current;

    await pmmSettingsPage.waitForPmmSettingsPageLoaded();
    await pmmSettingsPage.expandSection(sectionNameToExpand, pmmSettingsPage.fields.advancedButton);
    pmmSettingsPage.switchAzure();
    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.openAddAzure();
    remoteInstancesPage.discoverAzure();
    remoteInstancesPage.startMonitoringOfInstance(current.instanceToMonitor);
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

Data(filters).Scenario('PMM-T746, PMM-T748 - Verify adding monitoring for Azure CHECK QAN @instances', async ({
  I, qanFilters, qanOverview, qanPage, current,
}) => {
  I.amOnPage(qanPage.url);
  qanFilters.applyFilter(current.filter);
  qanOverview.waitForOverviewLoaded();
  const count = await qanOverview.getCountOfItems();

  assert.ok(count > 0, `QAN queries for added Azure mysql service with env as ${current.filter} does not exist`);
}).retry(2);
