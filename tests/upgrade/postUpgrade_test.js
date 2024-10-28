const assert = require('assert');
const { SERVICE_TYPE } = require('../helper/constants');

const { locationsAPI, dashboardPage } = inject();

Feature('PMM server post Upgrade Tests').retry(1);

const mongoServiceName = 'mongo-backup-upgrade';

const location = {
  name: 'upgrade-location',
  description: 'upgrade-location description',
  ...locationsAPI.storageLocationConnection,
};

const sslinstances = new DataTable(['serviceName', 'version', 'container', 'serviceType', 'metric', 'dashboard']);

// Unskip after https://jira.percona.com/browse/PMM-12640
// sslinstances.add(['pgsql_14_ssl_service', '14', 'pgsql_14', 'postgres_ssl', 'pg_stat_database_xact_rollback', dashboardPage.postgresqlInstanceOverviewDashboard.url]);
sslinstances.add(['mysql_8.0_ssl_service', '8.0', 'mysql_8.0', 'mysql_ssl', 'mysql_global_status_max_used_connections', dashboardPage.mySQLInstanceOverview.url]);
sslinstances.add(['mongodb_6.0_ssl_service', '6.0', 'mongodb_6.0', 'mongodb_ssl', 'mongodb_connections', dashboardPage.mongoDbInstanceOverview.url]);

const clientDbServices = new DataTable(['serviceType', 'name', 'metric', 'annotationName', 'dashboard', 'upgrade_service']);

clientDbServices.add([SERVICE_TYPE.MYSQL, 'ps_', 'mysql_global_status_max_used_connections', 'annotation-for-mysql', dashboardPage.mysqlInstanceSummaryDashboard.url, 'mysql_upgrade']);
clientDbServices.add([SERVICE_TYPE.POSTGRESQL, 'PGSQL_', 'pg_stat_database_xact_rollback', 'annotation-for-postgres', dashboardPage.postgresqlInstanceSummaryDashboard.url, 'pgsql_upgrade']);
clientDbServices.add([SERVICE_TYPE.MONGODB, 'mongodb_', 'mongodb_connections', 'annotation-for-mongo', dashboardPage.mongoDbInstanceSummaryDashboard.url, 'mongo_upgrade']);

Scenario(
  '@PMM-T1504 - The user is able to do a backup for MongoDB after upgrade @post-mongo-backup-upgrade',
  async ({
    locationsAPI, inventoryAPI, backupAPI, backupInventoryPage,
  }) => {
    const backupName = 'backup_after_update';

    const { location_id } = await locationsAPI.getLocationDetails(location.name);
    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.MONGODB, mongoServiceName);
    const backupId = await backupAPI.startBackup(backupName, service_id, location_id);

    await backupAPI.waitForBackupFinish(backupId);
    backupInventoryPage.openInventoryPage();
    backupInventoryPage.verifyBackupSucceeded(backupName);
  },
);

Data(sslinstances).Scenario(
  'Verify metrics from SSL instances on PMM-Server @post-ssl-upgrade',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, current, grafanaAPI,
  }) => {
    const {
      serviceName, metric,
    } = current;
    let response; let result;
    const remoteServiceName = `remote_api_${serviceName}`;

    // Waiting for metrics to start hitting for remotely added services
    I.wait(10);

    // verify metric for client container node instance
    response = await grafanaAPI.checkMetricExist(metric, { type: 'service_name', value: serviceName });
    result = JSON.stringify(response.data.data.result);

    assert.ok(response.data.data.result.length !== 0, `Metrics ${metric} from ${serviceName} should be available but got empty ${result}`);

    // verify metric for remote instance
    response = await grafanaAPI.checkMetricExist(metric, { type: 'service_name', value: remoteServiceName });
    result = JSON.stringify(response.data.data.result);

    assert.ok(response.data.data.result.length !== 0, `Metrics ${metric} from ${remoteServiceName} should be available but got empty ${result}`);
  },
).retry(1);

Data(sslinstances).Scenario(
  'Verify dashboard for SSL Instances and services after upgrade @post-ssl-upgrade',
  async ({
    I, dashboardPage, adminPage, current,
  }) => {
    const {
      serviceName, dashboard,
    } = current;

    const serviceList = [serviceName, `remote_api_${serviceName}`];

    for (const service of serviceList) {
      I.amOnPage(dashboard);
      dashboardPage.waitForDashboardOpened();
      await adminPage.applyTimeRange('Last 5 minutes');
      await dashboardPage.applyFilter('Service Name', service);
      adminPage.performPageDown(5);
      await dashboardPage.expandEachDashboardRow();
      adminPage.performPageUp(5);
      await dashboardPage.verifyThereAreNoGraphsWithNA(3);
      await dashboardPage.verifyThereAreNoGraphsWithoutData(3);
    }
  },
).retry(1);

Data(sslinstances).Scenario(
  'Verify QAN after upgrade for SSL Instances added @post-ssl-upgrade',
  async ({
    I, queryAnalyticsPage, current, adminPage,
  }) => {
    const {
      serviceName,
    } = current;

    const serviceList = [serviceName, `remote_api_${serviceName}`];

    for (const service of serviceList) {
      I.amOnPage(I.buildUrlWithParams(queryAnalyticsPage.url, { from: 'now-5m' }));
      queryAnalyticsPage.waitForLoaded();
      await adminPage.applyTimeRange('Last 5 minutes');
      queryAnalyticsPage.waitForLoaded();
      await queryAnalyticsPage.filters.selectFilter(service);
      queryAnalyticsPage.waitForLoaded();
      const count = await queryAnalyticsPage.data.getCountOfItems();

      assert.ok(count > 0, `The queries for service ${service} instance do NOT exist, check QAN Data`);
    }
  },
).retry(1);
