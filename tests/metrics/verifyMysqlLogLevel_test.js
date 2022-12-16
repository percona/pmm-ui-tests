const assert = require('assert');
const faker = require('faker');

const { adminPage } = inject();

Feature('Integration tests for Mysql Exporter PMM Agent and Log Level');
const pmmFrameworkLoader = `bash ${adminPage.pathToFramework}`;

const connection = {
  // eslint-disable-next-line no-inline-comments
  port: '3307', // This is the port used by --setup-pmm-ps-integration --pmm2 --query-source=slowlog --ps-version=8.0
  container_name: 'ps_pmm_8.0',
  username: 'msandbox',
  password: 'msandbox',
};
const mysql_service_name_ac = 'mysql_service';

BeforeSuite(async ({ I, grafanaAPI }) => {
  await I.verifyCommand(`${pmmFrameworkLoader} --setup-pmm-ps-integration --pmm2 --query-source=slowlog --ps-version=8.0`);
});

Before(async ({ I }) => {
  await I.Authorize();
});

After(async ({ I }) => {
  await I.verifyCommand(`docker exec ${connection.container_name} pmm-admin remove mysql ${mysql_service_name_ac} || true`);
});

Scenario(
  'PMM-T1307 PMM-T1306 PMM-T1305 PMM-T1304 PMM-T1290 PMM-T1281 Verify that pmm-admin inventory add agent mysqld-exporter with --log-level flag adds MySQL exporter with corresponding log-level @not-ui-pipeline @exporters',
  async ({
    I, inventoryAPI, grafanaAPI, dashboardPage,
  }) => {
    I.amOnPage(dashboardPage.mysqlInstanceSummaryDashboard.url);
    dashboardPage.waitForDashboardOpened();
    // adding service which will be used to verify various inventory addition commands
    await I.say(await I.verifyCommand(`docker exec ${connection.container_name} pmm-admin add mysql --port=${connection.port} --agent-password='testing' --password=${connection.password} --username=${connection.username} --port=${connection.port} --query-source=slowlog --service-name=${mysql_service_name_ac}`));
    //
    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MYSQL_SERVICE', mysql_service_name_ac);
    const pmm_agent_id = (await I.verifyCommand(`docker exec ${connection.container_name} pmm-admin status | grep "Agent ID" | awk -F " " '{print $4}'`)).trim();

    const dbDetails = {
      username: connection.username,
      password: connection.password,
      pmm_agent_id,
      service_id,
      port: connection.port,
      service_name: mysql_service_name_ac,
      container_name: connection.container_name,
    };

    await inventoryAPI.verifyAgentLogLevel('mysql', dbDetails);
    await inventoryAPI.verifyAgentLogLevel('qan-slowlog', dbDetails);
    await inventoryAPI.verifyAgentLogLevel('qan-perfschema', dbDetails);
    await inventoryAPI.verifyAgentLogLevel('mysql', dbDetails, 'debug');
    await inventoryAPI.verifyAgentLogLevel('qan-slowlog', dbDetails, 'debug');
    await inventoryAPI.verifyAgentLogLevel('qan-perfschema', dbDetails, 'debug');
    await inventoryAPI.verifyAgentLogLevel('mysql', dbDetails, 'info');
    await inventoryAPI.verifyAgentLogLevel('qan-slowlog', dbDetails, 'info');
    await inventoryAPI.verifyAgentLogLevel('qan-perfschema', dbDetails, 'info');
    await inventoryAPI.verifyAgentLogLevel('mysql', dbDetails, 'warn');
    await inventoryAPI.verifyAgentLogLevel('qan-slowlog', dbDetails, 'warn');
    await inventoryAPI.verifyAgentLogLevel('qan-perfschema', dbDetails, 'warn');
    await inventoryAPI.verifyAgentLogLevel('mysql', dbDetails, 'error');
    await inventoryAPI.verifyAgentLogLevel('qan-slowlog', dbDetails, 'error');
    await inventoryAPI.verifyAgentLogLevel('qan-perfschema', dbDetails, 'error');
  },
);

Scenario(
  'PMM-T1351 PMM-T1350 Verify that MySQL exporter cannot be added by pmm-admin add mysql with --log-level=fatal @not-ui-pipeline @exporters',
  async ({
    I, inventoryAPI, grafanaAPI, dashboardPage,
  }) => {
    I.amOnPage(dashboardPage.mysqlInstanceSummaryDashboard.url);
    dashboardPage.waitForDashboardOpened();
    // adding service which will be used to verify various inventory addition commands
    await I.say(await I.verifyCommand(`docker exec ${connection.container_name} pmm-admin add mysql --port=${connection.port} --agent-password='testing' --password=${connection.password} --username=${connection.username} --port=${connection.port} --query-source=slowlog --log-level=fatal --service-name=${mysql_service_name_ac}`, 'pmm-admin: error: --log-level must be one of "debug","info","warn","error" but got "fatal"', 'fail'));

    // adding service which will be used to verify various inventory addition commands
    await I.say(await I.verifyCommand(`docker exec ${connection.container_name} pmm-admin add mysql --port=${connection.port} --agent-password='testing' --password=${connection.password} --username=${connection.username} --port=${connection.port} --query-source=slowlog --service-name=${mysql_service_name_ac}`));

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MYSQL_SERVICE', mysql_service_name_ac);
    const pmm_agent_id = (await I.verifyCommand(`docker exec ${connection.container_name} pmm-admin status | grep "Agent ID" | awk -F " " '{print $4}'`)).trim();
    const node_id = (await I.verifyCommand(`docker exec ${connection.container_name} pmm-admin status | grep "Node ID" | awk -F " " '{print $4}'`)).trim();

    const dbDetails = {
      username: connection.username,
      password: connection.password,
      pmm_agent_id,
      service_id,
      port: connection.port,
      service_name: mysql_service_name_ac,
      container_name: connection.container_name,
    };

    await I.verifyCommand(`docker exec ${connection.container_name} pmm-admin inventory add agent mysqld-exporter --log-level=fatal --password=${dbDetails.password} --push-metrics ${dbDetails.pmm_agent_id} ${dbDetails.service_id} ${dbDetails.username}`, 'pmm-admin: error: --log-level must be one of "debug","info","warn","error" but got "fatal"', 'fail');
    await I.verifyCommand(`docker exec ${connection.container_name} pmm-admin inventory add service mysql --socket=/tmp/mysql_sandbox3307.sock temp ${node_id} 127.0.0.1 3307`, 'Socket and address cannot be specified together.', 'fail');
  },
);
