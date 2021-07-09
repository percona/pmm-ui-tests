const assert = require('assert');

const { remoteInstancesPage, remoteInstancesHelper } = inject();

const filters = new DataTable(['filter']);
const azureServices = new DataTable(['name', 'instanceToMonitor']);

if (remoteInstancesHelper.getInstanceStatus('azure').azure_mysql.enabled) {
  azureServices.add(['azure-MySQL', 'pmm2-qa-mysql']);
  filters.add([remoteInstancesPage.mysqlAzureInputs.environment]);
}

if (remoteInstancesHelper.getInstanceStatus('azure').azure_postgresql.enabled) {
  azureServices.add(['azure-PostgreSQL', 'pmm2-qa-postgresql']);
  filters.add([remoteInstancesPage.postgresqlAzureInputs.environment]);
}

Feature('Monitoring Azure MySQL and PostgreSQL DB');

Before(async ({ I }) => {
  await I.Authorize();
});

Data(azureServices).Scenario(
  'PMM-T744, PMM-T746, PMM-T748 - Verify adding monitoring for Azure @instances',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, settingsAPI, current,
  }) => {
    const serviceName = current.name;

    await settingsAPI.enableAzure();
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
    I, pmmSettingsPage, remoteInstancesPage, settingsAPI,
  }) => {
    const sectionNameToExpand = pmmSettingsPage.sectionTabsList.advanced;

    I.amOnPage(pmmSettingsPage.url);
    await settingsAPI.disableAzure();
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
).retry(2);

Data(filters).Scenario('PMM-T746, PMM-T748 - Verify adding monitoring for Azure CHECK QAN @instances', async ({
  I, qanFilters, qanOverview, qanPage, current,
}) => {
  I.amOnPage(qanPage.url);
  qanFilters.applyFilter(current.filter);
  qanOverview.waitForOverviewLoaded();
  const count = await qanOverview.getCountOfItems();

  assert.ok(count > 0, `QAN queries for added Azure service with env as ${current.filter} does not exist`);
}).retry(3);
