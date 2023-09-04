const assert = require('assert');

const { I, remoteInstancesPage, pmmInventoryPage,  remoteInstancesHelper } = inject();

const externalExporterServiceName = 'external_service_new';
const haproxyServiceName = 'haproxy_remote';

const instances = new DataTable(['name']);
const remotePostgreSQL = new DataTable(['instanceName', 'trackingOption', 'checkAgent']);
const qanFilters = new DataTable(['filterName']);
const dashboardCheck = new DataTable(['serviceName']);
const metrics = new DataTable(['serviceName', 'metricName']);

metrics.add(['pmm-server-postgresql', 'pg_stat_database_xact_rollback']);
metrics.add([externalExporterServiceName, 'redis_uptime_in_seconds']);
metrics.add([haproxyServiceName, 'haproxy_process_start_time_seconds']);

for (const [key, value] of Object.entries(remoteInstancesHelper.services)) {
  if (value) {
    switch (key) {
      case 'postgresql':
        // TODO: https://jira.percona.com/browse/PMM-9011
        // eslint-disable-next-line max-len
        // remotePostgreSQL.add(['postgresPGStatStatements', remoteInstancesPage.fields.usePgStatStatements, pmmInventoryPage.fields.postgresPgStatements]);
        // qanFilters.add([remoteInstancesPage.potgresqlSettings.environment]);
        // dashboardCheck.add([remoteInstancesHelper.services.postgresql]);
        // metrics.add([remoteInstancesHelper.services.postgresql, 'pg_stat_database_xact_rollback']);
        break;
      case 'mysql':
        qanFilters.add([remoteInstancesPage.mysqlSettings.environment]);
        metrics.add([remoteInstancesHelper.services.mysql, 'mysql_global_status_max_used_connections']);
        break;
      case 'postgresGC':
        dashboardCheck.add([remoteInstancesHelper.services.postgresGC]);
        qanFilters.add([remoteInstancesPage.postgresGCSettings.environment]);
        break;
      case 'mysql_ssl':
        qanFilters.add([remoteInstancesHelper.remote_instance.mysql.ms_8_0_ssl.environment]);
        break;
      case 'postgres_ssl':
        qanFilters.add([remoteInstancesHelper.remote_instance.postgresql.postgres_13_3_ssl.environment]);
        break;
      case 'mongodb':
        metrics.add([remoteInstancesHelper.services.mongodb, 'mongodb_up']);
        break;
      case 'proxysql':
        metrics.add([remoteInstancesHelper.services.proxysql, 'proxysql_up']);
        break;
      default:
    }
    instances.add([key]);
  }
}

Feature('Inventory page');

Before(async ({ I }) => {
  await I.Authorize();
});

// Skipping temporarily because sorting is not yet implemented in new Inventory page (PMM 2.37.0)
Scenario.skip(
  'PMM-T371 - Verify sorting in Inventory page(Services tab) @inventory @nightly',
  async ({ I, pmmInventoryPage }) => {
    I.amOnPage(pmmInventoryPage.url);
    await pmmInventoryPage.checkSort(4);
  },
);

Scenario.skip(
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
    await I.amOnPage(pmmInventoryPage.url);
    await I.waitForVisible(pmmInventoryPage.fields.showRowDetails, 10);
    await pmmInventoryPage.servicesTab.pagination.selectRowsPerPage(50);

    const services = Object.values((await inventoryAPI.apiGetServices()).data).flat(Infinity)
      .map((o) => (o.service_name));

    for (const sn of services) {
      await I.waitForVisible(pmmInventoryPage.fields.showServiceDetails(sn), 10);
      await I.click(pmmInventoryPage.fields.showServiceDetails(sn));
      await I.waitForText('running', pmmInventoryPage.fields.agentStatus);
      await I.waitForVisible(pmmInventoryPage.fields.hideServiceDetails(sn), 10);
      await I.click(pmmInventoryPage.fields.hideServiceDetails(sn));
    }
  },
);

Scenario(
  'PMM-T1226 - Verify Agents has process_exec_path option on Inventory page @inventory @nightly @exporters',
  async ({ I, pmmInventoryPage, inventoryAPI }) => {
    I.amOnPage(pmmInventoryPage.url);
    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('POSTGRESQL_SERVICE', 'pmm-server-postgresql');

    await pmmInventoryPage.openAgents(service_id);
    await pmmInventoryPage.checkAgentOtherDetailsSection('Postgres exporter', 'process_exec_path=/usr/local/percona/pmm2/exporters/postgres_exporter');

    const actAg = await inventoryAPI.apiGetAgents();
    const arr = [];

    for (const key of Object.keys(actAg.data)) {
      if (key.endsWith('exporter') && key !== 'external_exporter') {
        // eslint-disable-next-line no-return-assign
        actAg.data[key].map((o) => o.type = key);

        arr.push(...actAg.data[key]);
      }
    }

    assert.ok(arr.length, 'no exporter agents found');

    for (const key of arr) {
      await I.say(JSON.stringify(key, null, 2));
      assert.ok(key.process_exec_path, `process_exec_path value is empty for ${key.type}`);
    }
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

Data(instances).Scenario(
  'Verify Remote Instances can be created and edited [critical] @inventory',
  async ({
    I, pmmInventoryPage, current,
  }) => {
    const serviceName = remoteInstancesHelper.services[current.name];

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage(current.name);
    await remoteInstancesPage.fillRemoteFields(serviceName);
    remoteInstancesPage.createRemoteInstance(serviceName);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(serviceName);
    pmmInventoryPage.editRemoteServiceDisplayed(serviceName);
  },
);
