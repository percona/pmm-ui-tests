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
    const nodeName = 'azure-MySQL';

    I.amOnPage(homePage.url);
    await dashboardPage.applyFilter('Node Name', nodeName);
    homePage.verifyVisibleService(nodeName);
    // part without RDS MySQL should be skipped for now
  },
).retry(2);

Data(filters).Scenario('PMM-T746, PMM-T748 - Verify adding monitoring for Azure CHECK QAN @instances', async ({
  I, qanFilters, qanOverview, qanPage, current,
}) => {
  I.amOnPage(qanPage.refreshRateFiveSecondsUrl);
  I.waitForElement(qanFilters.elements.filterItem('Environment', current.filter), 60);
  qanFilters.applyFilter(current.filter);
  qanOverview.waitForOverviewLoaded();
  const count = await qanOverview.getCountOfItems();

  assert.ok(count > 0, `QAN queries for added Azure service with env as ${current.filter} do not exist`);
}).retry(1);

Data(metrics).Scenario(
  'PMM-T743 Check metrics from exporters are hitting PMM Server @instances',
  async ({ grafanaAPI, current }) => {
    await grafanaAPI.waitForMetric(current.metricName, null, 10);
  },
);
