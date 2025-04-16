const assert = require('assert');

const { adminPage } = inject();

Feature('Integration tests for Percona Server (Replica) & PMM');

Before(async ({ I, settingsAPI }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T2028 - Verify metrics from PS Replica instance on PMM-Server @pmm-ps-replica-integration @not-ui-pipeline @nightly',
  async ({
    I, grafanaAPI, inventoryAPI,
  }) => {
    let response; let result;
    const metricNames = ['mysql_slave_status_slave_io_running', 'mysql_slave_status_slave_sql_running'];

    const slaveServiceName = (await inventoryAPI.getServiceDetailsByPartialName('slave')).service_name;

    // verify metric for client container slave service
    response = await grafanaAPI.checkMetricExist(metricNames[0], { type: 'service_name', value: slaveServiceName });
    result = JSON.stringify(response.data.results);

    assert.ok(response.data.results.A.frames[0].data.values.length !== 0, `Metrics ${metricNames[0]} from ${slaveServiceName} should be available but got empty ${result}`);

    // verify metric for client container slave service
    response = await grafanaAPI.checkMetricExist(metricNames[1], { type: 'service_name', value: slaveServiceName });
    result = JSON.stringify(response.data.results);

    assert.ok(response.data.results.A.frames[0].data.values.length !== 0, `Metrics ${metricNames[1]} from ${slaveServiceName} should be available but got empty ${result}`);
  },
).retry(1);

Scenario(
  'PMM-T2029 - Verify dashboard for PS Replica Instance @pmm-ps-replica-integration @not-ui-pipeline @nightly',
  async ({
    I, dashboardPage, adminPage, inventoryAPI,
  }) => {
    const masterServiceName = (await inventoryAPI.getServiceDetailsByPartialName('master')).service_name;
    const slaveServiceName = (await inventoryAPI.getServiceDetailsByPartialName('slave')).service_name;

    const serviceList = [masterServiceName, slaveServiceName];

    for (const service of serviceList) {
      const url = I.buildUrlWithParams(dashboardPage.mysqlReplcationDashboard.clearUrl, { from: 'now-5m', to: 'now', service_name: service });

      I.amOnPage(url);
      await dashboardPage.waitForDashboardOpened();
      adminPage.performPageDown(5);
      await dashboardPage.expandEachDashboardRow();
      adminPage.performPageUp(5);
      await dashboardPage.verifyMetricsExistence(dashboardPage.mysqlReplcationDashboard.metrics);
      if (service === masterServiceName) {
        await dashboardPage.verifyThereAreNoGraphsWithoutData(9);
      } else {
        await dashboardPage.verifyThereAreNoGraphsWithoutData(2);
      }
    }
  },
).retry(2);

Scenario(
  'PMM-T2030 - Verify QAN for PS Replica Instance @pmm-ps-replica-integration @not-ui-pipeline @nightly',
  async ({
    I, queryAnalyticsPage, inventoryAPI,
  }) => {
    const slaveServiceName = (await inventoryAPI.getServiceDetailsByPartialName('slave')).service_name;
    const serviceList = [slaveServiceName];

    for (const service of serviceList) {
      I.amOnPage(I.buildUrlWithParams(queryAnalyticsPage.url, { from: 'now-5m' }));
      queryAnalyticsPage.waitForLoaded();
      await adminPage.applyTimeRange('Last 12 hours');
      queryAnalyticsPage.waitForLoaded();
      await queryAnalyticsPage.filters.selectFilterInGroup(service, 'Service Name');
      queryAnalyticsPage.waitForLoaded();
      await queryAnalyticsPage.filters.selectFilterInGroup('sbtest', 'Schema');
      queryAnalyticsPage.waitForLoaded();

      const count = await queryAnalyticsPage.data.getCountOfItems();

      assert.ok(count > 0, `The queries for service ${service} instance do NOT exist, check QAN Data`);
    }
  },
).retry(1);
