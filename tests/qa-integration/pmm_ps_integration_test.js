const assert = require('assert');

const { adminPage } = inject();

Feature('Integration tests for Percona Server & PMM');

Before(async ({ I, settingsAPI }) => {
  await I.Authorize();
});

const version = process.env.PS_VERSION ? `${process.env.PS_VERSION}` : '8.0';
const container_name = `ps_pmm_${version}`;
const remoteServiceName = 'remote_pmm-mysql-integration';

const connection = {
  host: container_name,
  username: 'msandbox',
  password: 'msandbox',
};

Scenario(
  'Verify Adding Mysql services remotely @pmm-ps-integration @not-ui-pipeline',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, inventoryAPI,
  }) => {
    const port = await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep "MySQL" | grep "mysql_client" | awk -F":" '{print $2}' | awk -F" " '{ print $1}' | head -1`);
    const details = {
      serviceName: remoteServiceName,
      serviceType: 'MYSQL_SERVICE',
      port,
      username: connection.username,
      password: connection.password,
      host: container_name,
      cluster: 'ps_remote_cluster',
      environment: 'ps_remote_cluster',
    };

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage('mysql');
    I.fillField(remoteInstancesPage.fields.hostName, details.host);
    I.clearField(remoteInstancesPage.fields.portNumber);
    I.fillField(remoteInstancesPage.fields.portNumber, details.port);
    I.fillField(remoteInstancesPage.fields.userName, details.username);
    I.fillField(remoteInstancesPage.fields.serviceName, remoteServiceName);
    I.fillField(remoteInstancesPage.fields.password, details.password);
    I.fillField(remoteInstancesPage.fields.environment, details.environment);
    I.fillField(remoteInstancesPage.fields.cluster, details.cluster);
    I.click(remoteInstancesPage.fields.addService);
    //I.waitForVisible(pmmInventoryPage.fields.agentsLink, 30);
    await inventoryAPI.verifyServiceExistsAndHasRunningStatus(
      {
        serviceType: 'MYSQL_SERVICE',
        service: 'mysql',
      },
      details.serviceName,
    );

    // Check Remote Instance also added and have running status
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(remoteServiceName);
    await pmmInventoryPage.verifyAgentHasStatusRunning(remoteServiceName);
  },
);

Scenario(
  'Verify metrics from PS instances on PMM-Server @pmm-ps-integration @not-ui-pipeline',
  async ({
    I, grafanaAPI,
  }) => {
    let response; let result;
    const metricName = 'mysql_global_status_max_used_connections';

    await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep "mysqld_exporter" | grep "Running" | wc -l | grep "1"`);
    await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep "mysql_slowlog_agent" | grep "Running" | wc -l | grep "1"`);

    const clientServiceName = (await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep MySQL | head -1 | awk -F" " '{print $2}'`)).trim();

    // Waiting for metrics to start hitting for remotely added services
    I.wait(10);

    // verify metric for client container node instance
    response = await grafanaAPI.checkMetricExist(metricName, { type: 'service_name', value: clientServiceName });
    result = JSON.stringify(response.data.data.result);

    assert.ok(response.data.data.result.length !== 0, `Metrics ${metricName} from ${clientServiceName} should be available but got empty ${result}`);

    // verify metric for remote instance
    response = await grafanaAPI.checkMetricExist(metricName, { type: 'service_name', value: remoteServiceName });
    result = JSON.stringify(response.data.data.result);

    assert.ok(response.data.data.result.length !== 0, `Metrics ${metricName} from ${remoteServiceName} should be available but got empty ${result}`);
  },
).retry(1);

Scenario(
  'Verify dashboard after PS Instances are added @pmm-ps-integration @not-ui-pipeline',
  async ({
    I, dashboardPage, adminPage,
  }) => {
    const clientServiceName = (await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep MySQL | head -1 | awk -F" " '{print $2}'`)).trim();

    const serviceList = [clientServiceName, remoteServiceName];

    for (const service of serviceList) {
      const url = I.buildUrlWithParams(dashboardPage.mysqlInstanceSummaryDashboard.clearUrl, { from: 'now-5m', to: 'now', service_name: service });

      I.amOnPage(url);
      dashboardPage.waitForDashboardOpened();
      adminPage.performPageDown(5);
      await dashboardPage.expandEachDashboardRow();
      adminPage.performPageUp(5);
      if (service === remoteServiceName) {
        await dashboardPage.verifyThereAreNoGraphsWithNA(7);
        await dashboardPage.verifyThereAreNoGraphsWithoutData(9);
      } else {
        await dashboardPage.verifyThereAreNoGraphsWithNA(1);
        await dashboardPage.verifyThereAreNoGraphsWithoutData(5);
      }
    }
  },
).retry(1);

Scenario(
  'Verify QAN after PS Instances is added @pmm-ps-integration @not-ui-pipeline',
  async ({
    I, qanOverview, qanFilters, qanPage, adminPage,
  }) => {
    const clientServiceName = (await I.verifyCommand(`docker exec ${container_name} pmm-admin list | grep MySQL | head -1 | awk -F" " '{print $2}'`)).trim();

    const serviceList = [clientServiceName, remoteServiceName];

    for (const service of serviceList) {
      const url = I.buildUrlWithParams(qanPage.clearUrl, { from: 'now-120m', to: 'now' });

      I.amOnPage(url);
      qanOverview.waitForOverviewLoaded();
      qanFilters.waitForFiltersToLoad();
      await qanFilters.applySpecificFilter(service);
      qanOverview.waitForOverviewLoaded();
      const count = await qanOverview.getCountOfItems();

      assert.ok(count > 0, `The queries for service ${service} instance do NOT exist, check QAN Data`);
    }
  },
).retry(1);

Scenario(
  'PMM-T1897 Verify Query Count metric on QAN page for MySQL @pmm-ps-integration',
  async ({
    I, credentials, qanOverview, qanPage, qanFilters, qanDetails,
  }) => {
    const dbName = 'sbtest3';
    const sbUser = { name: 'sysbench', password: 'test' };

    const psContainerName = await I.verifyCommand('sudo docker ps --format "{{.Names}}" | grep ps_');

    await I.verifyCommand(`sudo docker exec ${psContainerName} mysql -h 127.0.0.1 -u ${credentials.perconaServer.user} -p${credentials.perconaServer.password} -e "CREATE USER IF NOT EXISTS sysbench@'%' IDENTIFIED WITH mysql_native_password BY 'test'; GRANT ALL ON *.* TO sysbench@'%'; DROP DATABASE IF EXISTS ${dbName};"`);
    await I.verifyCommand(`sudo docker exec ${psContainerName} mysql -h 127.0.0.1 -u ${sbUser.name} -p${sbUser.password} -e "SET GLOBAL slow_query_log=ON;"`);
    await I.verifyCommand(`sudo docker exec ${psContainerName} mysql -h 127.0.0.1 -u ${sbUser.name} -p${sbUser.password} -e "SET GLOBAL long_query_time=0;"`);
    await I.verifyCommand(`sudo docker exec ${psContainerName} mysql -h 127.0.0.1 -u ${sbUser.name} -p${sbUser.password} -e "CREATE DATABASE ${dbName}"`);

    for (let i = 1; i <= 5; i++) {
      await I.verifyCommand(`sudo docker exec ${psContainerName} mysql -h 127.0.0.1 -u ${sbUser.name} -p${sbUser.password} ${dbName} -e "CREATE TABLE Persons${i} ( PersonID int, LastName varchar(255), FirstName varchar(255), Address varchar(255), City varchar(255) );"`);
      for (let j = 0; j <= 4; j++) {
        await I.verifyCommand(`sudo docker exec ${psContainerName} mysql -h 127.0.0.1 -u ${sbUser.name} -p${sbUser.password} ${dbName} -e "INSERT INTO Persons${i} values (${j},'Qwerty','Qwe','Address','City');"`);
      }

      await I.verifyCommand(`sudo docker exec ${psContainerName} mysql -h 127.0.0.1 -u ${sbUser.name} -p${sbUser.password} ${dbName} -e "select count(*) from Persons${i};"`);
    }

    I.amOnPage(I.buildUrlWithParams(qanPage.clearUrl, { from: 'now-1h', refresh: '5s' }));
    qanOverview.waitForOverviewLoaded();
    await qanFilters.applyFilter(dbName);
    qanOverview.waitForOverviewLoaded();
    I.waitForText('17', 180, qanOverview.elements.countOfItems);
    await qanOverview.selectRow(0);
    I.waitForText('105', 180, qanOverview.elements.queryCountValue);
    // await qanDetails.verifyQueryCount(105);
  },
).retry(0);
