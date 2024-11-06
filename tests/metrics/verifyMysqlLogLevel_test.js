const assert = require('assert');
const { SERVICE_TYPE } = require('../helper/constants');

Feature('Integration tests for Mysql Exporter PMM Agent and Log Level');

const connection = {
  // The port is generated by --database ps,QUERY_SOURCE=slowlog and will be assigned in BeforeSuite
  port: '',
  // The container_name is generated by --database ps,QUERY_SOURCE=slowlog and will be assigned in BeforeSuite
  container_name: '',
  username: 'msandbox',
  password: 'msandbox',
};
const mysql_service_name_ac = 'mysql_service';

BeforeSuite(async ({ I, inventoryAPI }) => {
  const psService = await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.MYSQL, 'ps-');

  connection.port = psService.port;

  // check that ps_pmm docker container exists
  const dockerCheck = await I.verifyCommand('docker ps | grep ps_pmm | awk \'{print $NF}\'');

  assert.ok(dockerCheck.includes('ps_pmm'), 'ps docker container should exist. please run pmm-framework with --database ps,QUERY_SOURCE=slowlog');
  connection.container_name = dockerCheck.trim();
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
    I, inventoryAPI, dashboardPage, mysqlAgentCli,
  }) => {
    I.amOnPage(dashboardPage.mysqlInstanceSummaryDashboard.url);
    dashboardPage.waitForDashboardOpened();
    // adding service which will be used to verify various inventory addition commands
    await I.say(await I.verifyCommand(`docker exec ${connection.container_name} pmm-admin add mysql --port=${connection.port} --agent-password='testing' --password=${connection.password} --username=${connection.username} --port=${connection.port} --query-source=slowlog --service-name=${mysql_service_name_ac}`));

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.MYSQL, mysql_service_name_ac);
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

    await mysqlAgentCli.verifyMySqlAgentLogLevel('mysqld-exporter', dbDetails);
    await mysqlAgentCli.verifyMySqlAgentLogLevel('qan-mysql-slowlog-agent', dbDetails);
    await mysqlAgentCli.verifyMySqlAgentLogLevel('qan-mysql-perfschema-agent', dbDetails);

    await mysqlAgentCli.verifyMySqlAgentLogLevel('mysqld-exporter', dbDetails, 'debug');
    await mysqlAgentCli.verifyMySqlAgentLogLevel('qan-mysql-slowlog-agent', dbDetails, 'debug');
    await mysqlAgentCli.verifyMySqlAgentLogLevel('qan-mysql-perfschema-agent', dbDetails, 'debug');

    await mysqlAgentCli.verifyMySqlAgentLogLevel('mysqld-exporter', dbDetails, 'info');
    await mysqlAgentCli.verifyMySqlAgentLogLevel('qan-mysql-slowlog-agent', dbDetails, 'info');
    await mysqlAgentCli.verifyMySqlAgentLogLevel('qan-mysql-perfschema-agent', dbDetails, 'info');

    await mysqlAgentCli.verifyMySqlAgentLogLevel('mysqld-exporter', dbDetails, 'warn');
    await mysqlAgentCli.verifyMySqlAgentLogLevel('qan-mysql-slowlog-agent', dbDetails, 'warn');
    await mysqlAgentCli.verifyMySqlAgentLogLevel('qan-mysql-perfschema-agent', dbDetails, 'warn');

    await mysqlAgentCli.verifyMySqlAgentLogLevel('mysqld-exporter', dbDetails, 'error');
    await inventoryAPI.verifyAgentLogLevel('qan-mysql-slowlog-agent', dbDetails, 'error');
    await inventoryAPI.verifyAgentLogLevel('qan-mysql-perfschema-agent', dbDetails, 'error');
  },
);

Scenario(
  'PMM-T1351 PMM-T1350 Verify that MySQL exporter cannot be added by pmm-admin add mysql with --log-level=fatal @not-ui-pipeline @exporters',
  async ({
    I, inventoryAPI, dashboardPage,
  }) => {
    I.amOnPage(dashboardPage.mysqlInstanceSummaryDashboard.url);
    dashboardPage.waitForDashboardOpened();
    // adding service which will be used to verify various inventory addition commands
    await I.say(await I.verifyCommand(`docker exec ${connection.container_name} pmm-admin add mysql --port=${connection.port} --agent-password='testing' --password=${connection.password} --username=${connection.username} --port=${connection.port} --query-source=slowlog --log-level=fatal --service-name=${mysql_service_name_ac}`, 'pmm-admin: error: --log-level must be one of "debug","info","warn","error" but got "fatal"', 'fail'));

    // adding service which will be used to verify various inventory addition commands
    await I.say(await I.verifyCommand(`docker exec ${connection.container_name} pmm-admin add mysql --port=${connection.port} --agent-password='testing' --password=${connection.password} --username=${connection.username} --port=${connection.port} --query-source=slowlog --service-name=${mysql_service_name_ac}`));

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName(SERVICE_TYPE.MYSQL, mysql_service_name_ac);
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

Scenario(
  'PMM-T1275 - Verify webConfigPlaceholder is generated on every Node exporter restart @not-ui-pipeline @exporters',
  async ({ I, pmmInventoryPage }) => {
    I.amOnPage(pmmInventoryPage.url);
    // Find node ID
    const nodeId = (await I.verifyCommand(`docker exec ${connection.container_name} ls /usr/local/percona/pmm/tmp/node_exporter/agent_id/`)).trim();

    // Verify and find ids of node exporter
    let processIds = await I.verifyCommand(`docker exec ${connection.container_name} pgrep node_exporter`);
    const processId = processIds.split(/(\s+)/);

    await I.verifyCommand(`docker exec ${connection.container_name} rm /usr/local/percona/pmm/tmp/node_exporter/agent_id/${nodeId}/webConfigPlaceholder`);
    const nodeFolder2 = await I.verifyCommand(`docker exec ${connection.container_name} ls /usr/local/percona/pmm/tmp/node_exporter/agent_id/${nodeId}/`);

    assert.ok(nodeFolder2.length === 0, 'folder webConfigPlaceholder was not removed.');

    await I.verifyCommand(`docker exec ${connection.container_name} kill -9 ${processId[0]}`);
    I.wait(2);
    processIds = await I.verifyCommand(`docker exec ${connection.container_name} pgrep node_exporter`);
    if (processId.length) {
      await I.verifyCommand(`docker exec ${connection.container_name} kill -9 ${processIds}`);
    }

    // Verify and find ids of node exporter
    I.wait(10);
    const nodeExporterRestart = await I.verifyCommand(`docker exec ${connection.container_name} pgrep node_exporter`);

    assert.ok(nodeExporterRestart.length, 'Node exporter is not restarted');

    const folderRestart = await I.verifyCommand(`docker exec ${connection.container_name} ls /usr/local/percona/pmm/tmp/node_exporter/agent_id/${nodeId}/`);

    assert.ok(folderRestart.includes('webConfigPlaceholder'), 'webConfigPlaceholder was not recreated after restart');

    // remove node exporter folder
    await I.verifyCommand(`docker exec ${connection.container_name} rm -r /usr/local/percona/pmm/tmp/node_exporter/`);
    let restartProcessId = nodeExporterRestart.split(/(\s+)/);

    await I.verifyCommand(`docker exec ${connection.container_name} kill -9 ${restartProcessId[0]}`);
    // Verify and find ids of node exporter
    I.wait(10);
    restartProcessId = await I.verifyCommand(`docker exec ${connection.container_name} pgrep node_exporter`);
    if (restartProcessId.length) {
      await I.verifyCommand(`docker exec ${connection.container_name} kill -9 ${restartProcessId}`);
    }

    await I.wait(15);
    const nodeExporterRemoved = await I.verifyCommand(`docker exec ${connection.container_name} pgrep node_exporter`);

    assert.ok(nodeExporterRemoved.length, 'Node exporter is not restarted');
    const folderRemoveNodeExporter = await I.verifyCommand(`docker exec ${connection.container_name} ls /usr/local/percona/pmm/tmp/node_exporter/agent_id/${nodeId}/`);

    assert.ok(folderRemoveNodeExporter.includes('webConfigPlaceholder'), 'webConfigPlaceholder was not recreated after restart');
  },
);
