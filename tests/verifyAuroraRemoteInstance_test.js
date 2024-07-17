const assert = require('assert');
const { NODE_TYPE, SERVICE_TYPE } = require('./helper/constants');

const { remoteInstancesHelper, pmmInventoryPage } = inject();

Feature('Monitoring Aurora instances');

const instances = new DataTable(['service_name', 'password', 'instance_id', 'cluster_name']);
const mysql_metric = 'mysql_global_status_max_used_connections';
const aurora_metric = 'mysql_global_status_aurora_total_op_memory';

instances.add([
  remoteInstancesHelper.remote_instance.aws.aurora.aurora2.address,
  remoteInstancesHelper.remote_instance.aws.aurora.aurora2.password,
  remoteInstancesHelper.remote_instance.aws.aurora.aurora2.instance_id,
  remoteInstancesHelper.remote_instance.aws.aurora.aurora2.cluster_name,
]);
instances.add([
  remoteInstancesHelper.remote_instance.aws.aurora.aurora3.address,
  remoteInstancesHelper.remote_instance.aws.aurora.aurora3.password,
  remoteInstancesHelper.remote_instance.aws.aurora.aurora3.instance_id,
  remoteInstancesHelper.remote_instance.aws.aurora.aurora3.cluster_name,
]);

Before(async ({ I }) => {
  await I.Authorize();
});

Data(instances).Scenario('@PMM-T1295 Verify adding Aurora remote instance @instances', async ({
  I, addInstanceAPI, inventoryAPI, current,
}) => {
  const {
    service_name, password, instance_id, cluster_name,
  } = current;

  const details = {
    add_node: {
      node_name: service_name,
      node_type: NODE_TYPE.REMOTE,
    },
    aws_access_key: remoteInstancesHelper.remote_instance.aws.aurora.aws_access_key,
    aws_secret_key: remoteInstancesHelper.remote_instance.aws.aurora.aws_secret_key,
    address: service_name,
    service_name: instance_id,
    port: remoteInstancesHelper.remote_instance.aws.aurora.port,
    username: remoteInstancesHelper.remote_instance.aws.aurora.username,
    password,
    instance_id,
    cluster: cluster_name,
  };

  await addInstanceAPI.addRDS(details.service_name, details);

  I.amOnPage(pmmInventoryPage.url);
  pmmInventoryPage.verifyRemoteServiceIsDisplayed(details.service_name);
  await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
    {
      serviceType: SERVICE_TYPE.MYSQL,
      service: 'mysql',
    },
    details.service_name,
  );
  // await pmmInventoryPage.verifyAgentHasStatusRunning(details.service_name);
});

// FIXME: Can be removed once https://jira.percona.com/browse/PMM-10201 is fixed
Data(instances)
  .Scenario('PMM-T1295 Verify Aurora instance metrics @instances', async ({ I, current, grafanaAPI }) => {
    const { instance_id } = current;

    // Waiting for metrics to start hitting for remotely added services
    I.wait(10);

    const response = await grafanaAPI.checkMetricExist(mysql_metric, {
      type: 'service_name',
      value: instance_id,
    });
    const result = JSON.stringify(response.data.data.result);

    assert.ok(
      response.data.data.result.length !== 0,
      `Metrics ${mysql_metric} from ${instance_id} should be available but got empty ${result}`,
    );
  })
  .retry(1);

// FIXME: Add also check for Aurora3 once https://jira.percona.com/browse/PMM-10201 is fixed
Scenario('PMM-T1295 Verify Aurora instance metrics @instances', async ({ I, grafanaAPI }) => {
  // Waiting for metrics to start hitting for remotely added services
  I.wait(10);

  const response = await grafanaAPI.checkMetricExist(aurora_metric, {
    type: 'service_name',
    value: 'pmm-qa-aurora2-mysql-instance-1',
  });
  const result = JSON.stringify(response.data.data.result);

  assert.ok(
    response.data.data.result.length !== 0,
    `Metrics ${aurora_metric} from pmm-qa-aurora2-mysql-instance-1 should be available but got empty ${result}`,
  );
}).retry(1);

// FIXME: Add also check for Aurora3 once https://jira.percona.com/browse/PMM-10201 is fixed
Scenario('PMM-T1295 Verify MySQL Amazon Aurora Details @instances', async ({ I, dashboardPage, adminPage }) => {
  I.amOnPage(dashboardPage.mysqlAmazonAuroraDetails.url);
  dashboardPage.waitForDashboardOpened();
  await adminPage.applyTimeRange('Last 5 minutes');
  await dashboardPage.applyFilter('Service Name', 'pmm-qa-aurora2-mysql-instance-1');
  await dashboardPage.verifyThereAreNoGraphsWithNA();
  await dashboardPage.verifyThereAreNoGraphsWithoutData(0);
}).retry(1);

Data(instances)
  .Scenario(
    'PMM-T1295 Verify dashboard after Aurora instance is added @instances',
    async ({
      I, dashboardPage, adminPage, current,
    }) => {
      const { instance_id } = current;

      I.amOnPage(dashboardPage.mySQLInstanceOverview.url);
      dashboardPage.waitForDashboardOpened();
      await adminPage.applyTimeRange('Last 5 minutes');
      await dashboardPage.applyFilter('Service Name', instance_id);
      adminPage.performPageDown(5);
      await dashboardPage.expandEachDashboardRow();
      adminPage.performPageUp(5);
      await dashboardPage.verifyThereAreNoGraphsWithNA();
      await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
    },
  )
  .retry(1);

Data(instances)
  .Scenario(
    'PMM-T1295 Verify QAN after Aurora instance is added @instances',
    async ({
      I, queryAnalyticsPage, current, adminPage,
    }) => {
      const { instance_id } = current;

      I.amOnPage(I.buildUrlWithParams(queryAnalyticsPage.url, { from: 'now-5m' }));
      queryAnalyticsPage.waitForLoaded();
      await adminPage.applyTimeRange('Last 12 hours');
      queryAnalyticsPage.waitForLoaded();
      await queryAnalyticsPage.filters.selectFilter(instance_id);
      queryAnalyticsPage.waitForLoaded();
      const count = await queryAnalyticsPage.data.getCountOfItems();

      assert.ok(count > 0, `The queries for service ${instance_id} instance do NOT exist, check QAN Data`);
    },
  )
  .retry(1);
