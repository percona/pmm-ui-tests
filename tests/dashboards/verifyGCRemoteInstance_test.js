const assert = require('assert');

const { remoteInstancesHelper } = inject();

Feature('Monitoring Mysql and Postgresql DB running on Google Cloud');

const instances = new DataTable(['instance', 'instanceType', 'metric']);

instances.add(['pgsql13', 'postgresql', 'pg_stat_database_xact_rollback']);
instances.add(['pgsql12', 'postgresql', 'pg_stat_database_xact_rollback']);
instances.add(['pgsql14', 'postgresql', 'pg_stat_database_xact_rollback']);
instances.add(['pgsql11', 'postgresql', 'pg_stat_database_xact_rollback']);
instances.add(['mysql57', 'mysql', 'mysql_global_status_max_used_connections']);
instances.add(['mysql80', 'mysql', 'mysql_global_status_max_used_connections']);

// Mapping here to avoid datatables to add those details to test names in allure report
const remoteInstance = {
  pgsql13: remoteInstancesHelper.remote_instance.gc.gc_pgsql_13,
  pgsql14: remoteInstancesHelper.remote_instance.gc.gc_pgsql_14,
  pgsql12: remoteInstancesHelper.remote_instance.gc.gc_pgsql_12,
  pgsql11: remoteInstancesHelper.remote_instance.gc.gc_pgsql_11,
  mysql57: remoteInstancesHelper.remote_instance.gc.gc_mysql57,
  mysql80: remoteInstancesHelper.remote_instance.gc.gc_mysql80,
};

function getInstance(key) {
  return remoteInstance[key];
}

Before(async ({ I, settingsAPI }) => {
  await I.Authorize();
});

Scenario(
  'Increasing Scrape Interval to Rare for remote pgsql instances bug @nightly @gcp',
  async ({
    I, settingsAPI,
  }) => {
    const body = {
      telemetry_enabled: true,
      metrics_resolutions: {
        hr: '60s',
        mr: '180s',
        lr: '300s',
      },
      data_retention: '172800s',
    };

    await settingsAPI.changeSettings(body, true);
  },
);

Data(instances).Scenario(
  'Verify adding Remote Google Cloud Instance @nightly @gcp',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, current,
  }) => {
    const {
      instance, instanceType,
    } = current;

    const instanceDetails = getInstance(instance);

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage(instanceType);
    await remoteInstancesPage.addRemoteDetails(instanceDetails);
    I.click(remoteInstancesPage.fields.addService);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(instanceDetails.serviceName);
    await pmmInventoryPage.verifyAgentHasStatusRunning(instanceDetails.serviceName);
    // Waiting for metrics to start hitting PMM-Server
    I.wait(20);
  },
).retry(1);

Data(instances).Scenario(
  'Verify dashboard after Remote GC Instances are added @nightly @gcp',
  async ({
    I, dashboardPage, adminPage, current,
  }) => {
    const {
      instance, instanceType,
    } = current;

    const instanceDetails = getInstance(instance);

    I.wait(10);
    if (instanceType === 'mysql') {
      I.amOnPage(dashboardPage.mySQLInstanceOverview.url);
    }

    if (instanceType === 'postgresql') {
      I.amOnPage(dashboardPage.postgresqlInstanceOverviewDashboard.url);
    }

    dashboardPage.waitForDashboardOpened();
    await dashboardPage.applyFilter('Service Name', instanceDetails.serviceName);
    adminPage.performPageDown(5);
    await dashboardPage.expandEachDashboardRow();
    adminPage.performPageUp(5);
    await dashboardPage.verifyThereAreNoGraphsWithNA();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
  },
).retry(2);

// skipping mysql gc because of PMM-9389
Data(instances.filter((instance) => instance.instanceType.indexOf('mysql') === -1)).Scenario(
  'Verify QAN after remote Google Cloud instance is added @nightly @gcp',
  async ({
    I, qanOverview, qanFilters, qanPage, current,
  }) => {
    const {
      instance,
    } = current;

    const instanceDetails = getInstance(instance);

    I.amOnPage(qanPage.url);
    qanOverview.waitForOverviewLoaded();
    qanFilters.waitForFiltersToLoad();
    await qanFilters.applyFilter(instanceDetails.serviceName);
    qanOverview.waitForOverviewLoaded();
    const count = await qanOverview.getCountOfItems();

    assert.ok(count > 0, `The queries for service ${instanceDetails.serviceName} instance do NOT exist`);
  },
).retry(1);

Data(instances).Scenario(
  'Check metrics from exporters are hitting PMM Server @nightly @gcp',
  async ({ I, dashboardPage, current }) => {
    const {
      instance, metric,
    } = current;

    const instanceDetails = getInstance(instance);

    I.wait(10);
    const response = await dashboardPage.checkMetricExist(metric, { type: 'service_name', value: instanceDetails.serviceName });
    const result = JSON.stringify(response.data.data.result);

    assert.ok(response.data.data.result.length !== 0, `Metrics ${metric} from ${instanceDetails.serviceName} should be available but got empty ${result}`);
  },
);

Scenario(
  'Setting back to default Scrape Interval @nightly @gcp',
  async ({
    I, settingsAPI,
  }) => {
    const body = {
      telemetry_enabled: true,
      metrics_resolutions: {
        hr: '5s',
        mr: '10s',
        lr: '60s',
      },
      data_retention: '172800s',
    };

    await settingsAPI.changeSettings(body, true);
  },
);
