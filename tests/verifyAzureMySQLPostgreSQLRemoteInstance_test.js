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

const metrics = new DataTable(['metricName']);

metrics.add(['azure_memory_percent_average']);
metrics.add(['mysql_global_status_max_used_connections']);
metrics.add(['mysql_global_variables_azure_ia_enabled']);

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
  'PMM-T756 - Verify Azure node is displayed on Home dashboard @instances',
  async ({
    I, homePage, dashboardPage,
  }) => {
    const mySQL = 'azure-MySQL';

    I.amOnPage(homePage.url);
    await dashboardPage.applyFilter('Node Name', mySQL);
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

Data(metrics).Scenario(
  'PMM-T743 Check metrics from exporters are hitting PMM Server @instances',
  async ({ I, dashboardPage, current }) => {
    // This is only needed to let PMM Consume Metrics
    I.wait(10);
    const response = await dashboardPage.checkMetricExist(current.metricName);
    const result = JSON.stringify(response.data.data.result);

    assert.ok(response.data.data.result.length !== 0, `Metrics ${current.metricName} should be available after adding Azure Instance but got empty ${result}`);
  },
).retry(1);
