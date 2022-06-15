const assert = require('assert');

const { remoteInstancesHelper, pmmInventoryPage } = inject();

Feature('Monitoring Aurora instances');

const instances = new DataTable(['serviceName', 'password', 'metric']);
const metric = 'mysql_global_status_max_used_connections';

instances.add([
  remoteInstancesHelper.remote_instance.aurora.aurora2.host,
  remoteInstancesHelper.remote_instance.aurora.aurora2.password,
  metric,
]);
instances.add([
  remoteInstancesHelper.remote_instance.aurora.aurora3.host,
  remoteInstancesHelper.remote_instance.aurora.aurora3.password,
  metric,
]);

Before(async ({ I }) => {
  await I.Authorize();
});

Data(instances).Scenario('PMM-TXXX Verify adding Aurora remote instance @instances', async ({ I, addInstanceAPI, current }) => {
  const { serviceName, password } = current;
  const details = {
    add_node: {
      node_name: serviceName,
    },
    service_name: serviceName,
    pmm_agent_id: 'pmm-server',
    address: serviceName,
    host: serviceName,
    port: remoteInstancesHelper.remote_instance.aurora.port,
    username: remoteInstancesHelper.remote_instance.aurora.username,
    password: password,
  };

  await addInstanceAPI.addMysql(details.service_name, details);

  I.amOnPage(pmmInventoryPage.url);
  pmmInventoryPage.verifyRemoteServiceIsDisplayed(details.service_name);
  await pmmInventoryPage.verifyAgentHasStatusRunning(details.service_name);
});

Data(instances)
  .Scenario('PMM-TXXX Verify Aurora instance metrics @instances',
    async ({ I, current, grafanaAPI }) => {
      const { serviceName, metric } = current;
      let response;
      let result;

      //Waiting for metrics to start hitting for remotely added services
      I.wait(10);

      // verify metric for client container node instance
      response = await grafanaAPI.checkMetricExist('mysql_global_status_max_used_connections', {
        type: 'service_name',
        value: 'pmm-qa-aurora2-mysql-instance-1.c977e3nvdnbr.us-east-2.rds.amazonaws.com',
      });
      result = JSON.stringify(response.data.data.result);

      assert.ok(
        response.data.data.result.length !== 0,
        `Metrics ${metric} from ${serviceName} should be available but got empty ${result}`,
      );
    },
  )
  .retry(1);

Data(instances)
  .Scenario('PMM-TXXX Verify dashboard after Aurora instance is added @instances',
    async ({ I, dashboardPage, adminPage, current }) => {
      const { serviceName } = current;

      I.amOnPage(dashboardPage.mySQLInstanceOverview.url);
      dashboardPage.waitForDashboardOpened();
      await adminPage.applyTimeRange('Last 5 minutes');
      await dashboardPage.applyFilter('Service Name', serviceName);
      adminPage.performPageDown(5);
      await dashboardPage.expandEachDashboardRow();
      adminPage.performPageUp(5);
      await dashboardPage.verifyThereAreNoGraphsWithNA();
      await dashboardPage.verifyThereAreNoGraphsWithoutData(1);
    },
  )
  .retry(1);

Data(instances)
  .Scenario('PMM-TXXX Verify QAN after Aurora instance is added @instances',
    async ({ I, qanOverview, qanFilters, qanPage, current, adminPage }) => {
      const { serviceName } = current;

      I.amOnPage(qanPage.url);
      qanOverview.waitForOverviewLoaded();
      await adminPage.applyTimeRange('Last 12 hours');
      qanOverview.waitForOverviewLoaded();
      qanFilters.waitForFiltersToLoad();
      await qanFilters.applySpecificFilter(serviceName);
      qanOverview.waitForOverviewLoaded();
      const count = await qanOverview.getCountOfItems();

      assert.ok(count > 0, `The queries for service ${serviceName} instance do NOT exist, check QAN Data`);
    },
  )
  .retry(1);
