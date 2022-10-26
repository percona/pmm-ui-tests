const assert = require('assert');
const faker = require('faker');

Feature('Inventory page');

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T371 - Verify sorting in Inventory page(Services tab) @inventory @nightly',
  async ({ I, pmmInventoryPage }) => {
    I.amOnPage(pmmInventoryPage.url);
    await pmmInventoryPage.checkSort(4);
  },
);

Scenario(
  'PMM-T371 - Verify sorting in Inventory page(Agents tab) @inventory @nightly',
  async ({ I, pmmInventoryPage }) => {
    I.amOnPage(pmmInventoryPage.url);
    I.waitForVisible(pmmInventoryPage.fields.agentsLink, 20);
    I.click(pmmInventoryPage.fields.agentsLink);
    await pmmInventoryPage.checkSort(3);
  },
);

Scenario(
  'PMM-T371 - Verify sorting in Inventory page(Nodes tab) @inventory @nightly',
  async ({ I, pmmInventoryPage }) => {
    I.amOnPage(pmmInventoryPage.url);
    I.waitForVisible(pmmInventoryPage.fields.nodesLink, 20);
    I.click(pmmInventoryPage.fields.nodesLink);
    await pmmInventoryPage.checkSort(4);
  },
);

Scenario(
  'PMM-T339 - Verify MySQL service is removed on PMM Inventory page @inventory',
  async ({ I, addInstanceAPI, pmmInventoryPage }) => {
    const serviceType = 'MySQL';
    const serviceName = 'ServiceToDelete';

    await addInstanceAPI.apiAddInstance(serviceType, serviceName);
    I.amOnPage(pmmInventoryPage.url);
    const serviceId = pmmInventoryPage.getServicesId(serviceName);

    pmmInventoryPage.selectService(serviceName);
    I.click(pmmInventoryPage.fields.deleteButton);
    I.click(pmmInventoryPage.fields.proceedButton);
    pmmInventoryPage.serviceExists(serviceName, false);
    pmmInventoryPage.selectService(serviceName);
    pmmInventoryPage.deleteWithForceOpt();
    pmmInventoryPage.serviceExists(serviceName, true);
    I.click(pmmInventoryPage.fields.agentsLink);
    await pmmInventoryPage.getCountOfAgents(serviceId);
    I.click(pmmInventoryPage.fields.nodesLink);
    pmmInventoryPage.checkNodeExists(serviceName);
  },
);

Scenario(
  'PMM-T340 - Verify node with agents, services can be removed on PMM Inventory page @inventory',
  async ({ I, addInstanceAPI, pmmInventoryPage }) => {
    const serviceType = 'MySQL';
    const serviceName = 'NodeToDelete';

    await addInstanceAPI.apiAddInstance(serviceType, serviceName);
    I.amOnPage(pmmInventoryPage.url);
    const serviceId = pmmInventoryPage.getServicesId(serviceName);

    I.waitForVisible(pmmInventoryPage.fields.nodesLink, 30);
    I.click(pmmInventoryPage.fields.nodesLink);
    pmmInventoryPage.selectService(serviceName);
    pmmInventoryPage.deleteWithForceOpt();
    I.click(pmmInventoryPage.fields.pmmServicesSelector);
    pmmInventoryPage.serviceExists(serviceName, true);
    I.click(pmmInventoryPage.fields.agentsLink);
    await pmmInventoryPage.getCountOfAgents(serviceId);
  },
);

Scenario(
  'PMM-T342 - Verify pmm-server node cannot be removed from PMM Inventory page @inventory',
  async ({ I, pmmInventoryPage }) => {
    const node = 'pmm-server';

    I.amOnPage(pmmInventoryPage.url);
    I.waitForVisible(pmmInventoryPage.fields.nodesLink, 30);
    I.click(pmmInventoryPage.fields.nodesLink);
    pmmInventoryPage.selectService(node);
    pmmInventoryPage.deleteWithForceOpt();
    pmmInventoryPage.checkNodeExists(node);
  },
);

Scenario(
  'PMM-T343 - Verify agent can be removed on PMM Inventory page @inventory',
  async ({ I, pmmInventoryPage, addInstanceAPI }) => {
    const agentType = 'MySQL exporter';
    const serviceType = 'MySQL';
    const serviceName = 'AgentToDelete';

    await addInstanceAPI.apiAddInstance(serviceType, serviceName);
    I.amOnPage(pmmInventoryPage.url);
    I.waitForVisible(pmmInventoryPage.fields.nodesLink, 20);
    I.click(pmmInventoryPage.fields.nodesLink);
    const countOfNodesBefore = await pmmInventoryPage.getNodeCount();

    I.waitForVisible(pmmInventoryPage.fields.agentsLink, 20);
    I.click(pmmInventoryPage.fields.agentsLink);
    const serviceId = await pmmInventoryPage.getAgentServiceID(agentType);
    const agentId = await pmmInventoryPage.getAgentID(agentType);

    pmmInventoryPage.selectAgent(agentType);
    I.click(pmmInventoryPage.fields.deleteButton);
    I.click(pmmInventoryPage.fields.proceedButton);
    pmmInventoryPage.existsByid(agentId, true);
    I.click(pmmInventoryPage.fields.nodesLink);
    const countOfNodesAfter = await pmmInventoryPage.getNodeCount();

    pmmInventoryPage.verifyNodesCount(countOfNodesBefore, countOfNodesAfter);
    I.click(pmmInventoryPage.fields.pmmServicesSelector);
    pmmInventoryPage.existsByid(serviceId, false);
  },
);

Scenario.skip(
  'PMM-T345 - Verify removing pmm-agent on PMM Inventory page removes all associated agents @inventory',
  async ({ I, pmmInventoryPage }) => {
    const agentID = 'pmm-server';
    const agentType = 'PMM Agent';

    I.amOnPage(pmmInventoryPage.url);
    I.waitForVisible(pmmInventoryPage.fields.agentsLink, 20);
    I.click(pmmInventoryPage.fields.agentsLink);
    const countBefore = await pmmInventoryPage.getCountOfItems();

    pmmInventoryPage.selectAgentByID(agentID);
    pmmInventoryPage.deleteWithForceOpt();
    pmmInventoryPage.existsByid(agentID, false);
    pmmInventoryPage.selectAgent(agentType);
    const agentIDToDelete = await pmmInventoryPage.getAgentID(agentType);

    pmmInventoryPage.deleteWithForceOpt();
    pmmInventoryPage.existsByid(agentIDToDelete, true);
    await pmmInventoryPage.checkAllNotDeletedAgents(countBefore);
  },
);

Scenario(
  'PMM-T554 - Check that all agents have status "RUNNING" @inventory @nightly',
  async ({ I, pmmInventoryPage, inventoryAPI }) => {
    const statuses = ['WAITING', 'STARTING', 'UNKNOWN'];
    const serviceIdsNotRunning = [];
    const servicesNotRunning = [];

    I.amOnPage(pmmInventoryPage.url);
    I.waitForVisible(pmmInventoryPage.fields.agentsLink, 20);
    I.click(pmmInventoryPage.fields.agentsLink);

    for (const status of statuses) {
      const ids = await pmmInventoryPage.getServiceIdWithStatus(status);

      serviceIdsNotRunning.push(...ids);
    }

    if (serviceIdsNotRunning.length) {
      for (const id of serviceIdsNotRunning) {
        const service = await inventoryAPI.getServiceById(id);

        servicesNotRunning.push(...service);
      }

      assert.fail(`These services do not have RUNNING state: \n ${JSON.stringify(servicesNotRunning, null, 2)}`);
    }
  },
);

Scenario(
  'PMM-T1226 - Verify Agents has process_exec_path option on Inventory page @inventory @nightly @exporters',
  async ({ I, pmmInventoryPage }) => {
    I.amOnPage(pmmInventoryPage.url);
    await I.waitForVisible(pmmInventoryPage.fields.agentsLink, 20);
    I.click(pmmInventoryPage.fields.agentsLink);
    await I.waitForVisible(pmmInventoryPage.fields.tableRow);
    const agentTextValues = await I.grabTextFromAll(pmmInventoryPage.fields.processExecPathExporters);

    agentTextValues.forEach((value) => {
      if (!value.toLowerCase().includes('qan')) {
        assert.ok(value.includes('process_exec_path'), `process_exec_path is not present for exporter ${value}`);
        const newValue = value.replace('process_exec_path:', '').trim();

        assert.ok(newValue.length, `process_exec_path value is empty for ${value}`);
      }
    });
  },
);

Scenario(
  'PMM-T1225 - Verify summary file includes process_exec_path for agents @inventory @exporters @cli',
  async ({ I, pmmInventoryPage }) => {
    I.amOnPage(pmmInventoryPage.url);
    const response = await I.verifyCommand('pmm-admin summary');
    const statusFile = JSON.parse(await I.readFileInZipArchive(response.split(' ')[0], 'client/status.json'));
    const exporters = statusFile.agents_info.filter((agent) => !agent.agent_type.toLowerCase().includes('qan'));

    I.amOnPage(pmmInventoryPage.url);

    exporters.forEach((agent) => {
      if (agent.process_exec_path) {
        I.say(`process_exec_path for agent ${agent.agent_type} is ${agent.process_exec_path}`);
        assert.ok(agent.process_exec_path.length, `Process exec path for ${agent.agent_type} is empty`);
      } else {
        assert.fail(`Process exec path is not present for ${agent.agent_type}`);
      }
    });
  },
);

Scenario(
  'PMM-T1275 - Verify webConfigPlaceholder is generated on every Node exporter restart @inventory @exporters',
  async ({ I, pmmInventoryPage }) => {
    I.amOnPage(pmmInventoryPage.url);
    await I.waitForVisible(pmmInventoryPage.fields.agentsLink, 20);
    I.click(pmmInventoryPage.fields.agentsLink);
    await I.waitForVisible(pmmInventoryPage.fields.tableRow);
    const nodeStatus = await I.grabTextFrom(pmmInventoryPage.fields.nodeExporterStatus);

    assert.ok(nodeStatus.includes('RUNNING'), 'Node Exporter is not running');
    // Find node ID
    const nodeId = await I.verifyCommand('docker exec pmm-server ls /tmp/node_exporter/agent_id/');

    // Verify and find ids of node exporter
    let processIds = await I.verifyCommand('pgrep node_exporter');
    const processId = processIds.split(/(\s+)/);

    await I.verifyCommand(`docker exec pmm-server rm /tmp/node_exporter/agent_id/${nodeId}/webConfigPlaceholder`);
    const nodeFolder2 = await I.verifyCommand(`docker exec pmm-server ls /tmp/node_exporter/agent_id/${nodeId}/`);

    assert.ok(nodeFolder2.length === 0, 'folder webConfigPlaceholder was not removed.');

    await I.verifyCommand(`sudo kill -9 ${processId[0]}`);
    processIds = await I.verifyCommand('pgrep node_exporter');
    if (processId.length) {
      await I.verifyCommand(`sudo kill -9 ${processIds}`);
    }

    // Verify and find ids of node exporter
    await I.verifyCommand('pgrep node_exporter', '', 'fail');
    await I.wait(15);

    // Verify and find ids of node exporter
    const nodeExporterRestart = await I.verifyCommand('pgrep node_exporter');

    assert.ok(nodeExporterRestart.length, 'Node exporter is not restarted');

    const folderRestart = await I.verifyCommand(`docker exec pmm-server ls /tmp/node_exporter/agent_id/${nodeId}/`);

    assert.ok(folderRestart.includes('webConfigPlaceholder'), 'webConfigPlaceholder was not recreated after restart');

    // remove node exporter folder
    await I.verifyCommand('docker exec pmm-server rm -r /tmp/node_exporter/');
    let restartProcessId = nodeExporterRestart.split(/(\s+)/);

    await I.verifyCommand(`sudo kill -9 ${restartProcessId[0]}`);
    // Verify and find ids of node exporter
    restartProcessId = await I.verifyCommand('pgrep node_exporter');
    if (restartProcessId.length) {
      await I.verifyCommand(`sudo kill -9 ${restartProcessId}`);
    }

    await I.verifyCommand('pgrep node_exporter', '', 'fail');
    await I.wait(15);
    const nodeExporterRemoved = await I.verifyCommand('pgrep node_exporter');

    assert.ok(nodeExporterRemoved.length, 'Node exporter is not restarted');
    const folderRemoveNodeExporter = await I.verifyCommand(`docker exec pmm-server ls /tmp/node_exporter/agent_id/${nodeId}/`);

    assert.ok(folderRemoveNodeExporter.includes('webConfigPlaceholder'), 'webConfigPlaceholder was not recreated after restart');
  },
);

Scenario(
  'PMM-T164 Verify user cannot be able to add MySQL Service via pmm-admin inventory with specified socket and port',
  async ({
    I,
  }) => {
    const pmmAdminNodeId = (await I.verifyCommand('pmm-admin status | grep \'Node ID\' | awk -F " " \'{print $4}\' ')).trim();

    await I.verifyCommand(`pmm-admin inventory add service mysql --socket=/tmp/PXC_1.sock PXC-Inv ${pmmAdminNodeId} 127.0.0.1 3306 2>&1 | grep "Socket and address cannot be specified together."`);
  },
);

Scenario(
  'PMM-T467 Verify pmm-admin inventory add service external using with --group flag',
  async ({
    I,
  }) => {
    const firstServiceName = `service_${faker.random.alphaNumeric(3)}`;
    const secondServiceName = `service_${faker.random.alphaNumeric(3)}`;
    const thirdServiceName = `service_${faker.random.alphaNumeric(3)}`;
    const groupName = `group_${faker.random.alphaNumeric(3)}`;

    const pmmAdminNodeId = (await I.verifyCommand('pmm-admin status | grep \'Node ID\' | awk -F " " \'{print $4}\' ')).trim();

    await I.verifyCommand(`pmm-admin inventory add service external --node-id=${pmmAdminNodeId} --name=${firstServiceName}`);
    await I.verifyCommand(`pmm-admin inventory add service external --group= --node-id=${pmmAdminNodeId} --name=${secondServiceName}`);
    await I.verifyCommand(`pmm-admin inventory add service external --group=${groupName} --node-id=${pmmAdminNodeId} --name=${thirdServiceName}`);

    await I.verifyCommand(`pmm-admin list | grep '${firstServiceName}' | grep 'External:external'`);
    await I.verifyCommand(`pmm-admin list | grep '${secondServiceName}' | grep 'External:external'`);
    await I.verifyCommand(`pmm-admin list | grep '${thirdServiceName}' | grep 'External:${groupName}'`);
  },
);

Scenario(
  'PMM-T1352 Verify that Node exporter cannot be added by pmm-admin inventory add agent node-exporter with --log-level=fatal',
  async ({
    I,
  }) => {
    const pmmAdminAgentId = (await I.verifyCommand('pmm-admin status | grep \'Agent ID\' | awk -F " " \'{print $4}\'')).trim();

    await I.verifyCommand(`pmm-admin inventory add agent node-exporter --server-insecure-tls --log-level=fatal ${pmmAdminAgentId} 2>&1 | grep "error: --log-level must be one of \\"debug\\",\\"info\\",\\"warn\\",\\"error\\" but got \\"fatal\\""`);
  },
);

Scenario(
  'PMM-T1282, PMM-T1291'
  + ' Verify that pmm-admin inventory add agent node-exporter with --log-level flag adds Node exporter with corresponding log-level'
  + ' Verify that pmm-admin inventory add agent node-exporter with --log-level flag adds Node exporter with log-level=warn',
  async ({
    I, inventoryAPI,
  }) => {
    const logLevels = ['', 'debug', 'info', 'warn', 'error'];

    const agentName = 'node-exporter';

    const pmmAdminAgentId = (await I.verifyCommand('pmm-admin status | grep \'Agent ID\' | awk -F " " \'{print $4}\'')).trim();

    for (const logLevel of logLevels) {
      let expectedLogLevel = 'warn';
      let flags = '--server-insecure-tls';

      if (logLevel !== '') {
        flags = `${flags} --log-level=${logLevel}`;
        expectedLogLevel = logLevel;
      }

      const agentId = (await I.verifyCommand(`pmm-admin inventory add agent ${agentName} ${flags} ${pmmAdminAgentId} | grep '^Agent ID' | grep -o '/agent_id/[a-z0-9-]*'`)).trim();

      const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByAgentId(agentId);

      // eslint-disable-next-line no-prototype-builtins
      assert.ok(agentInfo.hasOwnProperty('log_level'), `Was expecting ${agentName} (${agentId}) to have "log_level" property`);
      assert.strictEqual(agentInfo.log_level, expectedLogLevel, `Was expecting ${agentName} for (${agentId}) to have "${expectedLogLevel}" as a log level`);
    }
  },
);

Scenario(
  'PMM-T610 Verify that pmm-admin inventory remove service with --force flag stops running agents and collecting data from exporters @nazarov',
  async ({
    I,
  }) => {
    const pmmServerContainer = (await I.verifyCommand('docker ps | grep \'pmm-server\' | awk -F " " \'{print $NF}\'')).trim();

    await I.verifyCommand('pmm-admin add mysql --username=root --password=GRgrO9301RuF --metrics-mode="pull" --query-source=perfschema mysql-pull 127.0.0.1:43306');
    const numberOfMysqlExportersBefore = parseInt(await I.verifyCommand('ps -ax | grep -c [m]ysqld_exporter'), 10);
    const numberOfMentionsInVictoriaMetricsBefore = parseInt(await I.verifyCommand(`docker exec ${pmmServerContainer} cat /etc/victoriametrics-promscrape.yml | grep -c mysql`), 10);

    assert.ok(numberOfMentionsInVictoriaMetricsBefore > 0, 'mysqld-exporter configuration was not added');
    await I.verifyCommand('pmm-admin remove mysql mysql-pull');

    const numberOfMysqlExportersAfter = parseInt(await I.verifyCommand('ps -ax | grep -c [m]ysqld_exporter || true'), 10);
    const numberOfMentionsInVictoriaMetricsAfter = parseInt(await I.verifyCommand(`docker exec ${pmmServerContainer} cat /etc/victoriametrics-promscrape.yml | grep -c mysqld || true`), 10);

    assert.strictEqual(numberOfMentionsInVictoriaMetricsAfter, 0, 'mysqld-exporter configuration was not deleted');
    assert.strictEqual(numberOfMysqlExportersAfter, numberOfMysqlExportersBefore - 1, 'The number of mysqld-exporters did not went down by one');
  },
);

Scenario(
  'PMM-T611 Verify that pmm-admin inventory remove node with --force flag stops running agents and collecting data from exporters @nazarov',
  async ({
    I, inventoryAPI, grafanaAPI,
  }) => {
    const numberOfNodesBefore = parseInt(await I.verifyCommand('ps -ax | grep -c [n]ode_exporter'), 10);

    const pmmAdminNodeId = (await I.verifyCommand('pmm-admin status | grep \'Node ID\' | awk -F " " \'{print $4}\' ')).trim();

    await I.verifyCommand(`pmm-admin inventory remove node ${pmmAdminNodeId} --force`);
    const numberOfNodesAfter = parseInt(await I.verifyCommand('ps -ax | grep -c [n]ode_exporter'), 10);

    assert.strictEqual(numberOfNodesAfter, numberOfNodesBefore - 1, 'The number of node-exporters did not went down by one');
    await grafanaAPI.checkMetricAbsent('mysql_global_status_max_used_connections');
  },
);
