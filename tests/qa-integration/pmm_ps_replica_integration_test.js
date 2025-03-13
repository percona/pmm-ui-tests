const assert = require('assert');
const { SERVICE_TYPE } = require('../helper/constants');

const { adminPage } = inject();

Feature('Integration tests for Percona Server (Replica) & PMM');

Before(async ({ I, settingsAPI }) => {
  await I.Authorize();
});

const version = process.env.PS_VERSION ? `${process.env.PS_VERSION}` : '8.4';
const container_name = `ps_pmm_${version}_replica`;

// PMM-12153 Update mysqld_exporter to the latest stable
Scenario.skip(
  'Verify metrics from PS Replica instance on PMM-Server @pmm-ps-replica-integration @not-ui-pipeline',
  async ({
    I, grafanaAPI,
  }) => {
    let response; let result;
    const metricNames = ['mysql_slave_status_slave_io_running', 'mysql_slave_status_slave_sql_running'];

    await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep "mysqld_exporter" | grep "Running" | wc -l | grep "2"`);
    await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep "mysql_perfschema_agent" | grep "Running" | wc -l | grep "2"`);

    const slaveServiceName = (await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep MySQL | grep node-2 | awk -F" " '{print $2}'`)).trim();

    // Waiting for metrics to start hitting for remotely added services
    I.wait(10);

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

// PMM-12153 Update mysqld_exporter to the latest stable
// Also adjust Graphs without Data below
Scenario.skip(
  'Verify dashboard for PS Replica Instance @pmm-ps-replica-integration @not-ui-pipeline',
  async ({
    I, dashboardPage, adminPage,
  }) => {
    const masterServiceName = (await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep MySQL | grep node-1 | awk -F" " '{print $2}'`)).trim();
    const slaveServiceName = (await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep MySQL | grep node-2 | awk -F" " '{print $2}'`)).trim();

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

// PMM-12153 Update mysqld_exporter to the latest stable
Scenario.skip(
  'Verify QAN for PS Replica Instance @pmm-ps-replica-integration @not-ui-pipeline',
  async ({
    I, queryAnalyticsPage,
  }) => {
    const slaveServiceName = (await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep MySQL | grep node-2 | awk -F" " '{print $2}'`)).trim();
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
