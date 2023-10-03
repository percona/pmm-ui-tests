const assert = require('assert');
const testData = require('./testData');

const {
  I, remoteInstancesPage, pmmInventoryPage, remoteInstancesHelper,
} = inject();

const externalExporterServiceName = 'external_service_new';
const haproxyServiceName = 'haproxy_remote';

const instances = new DataTable(['name']);
const qanFilters = new DataTable(['filterName']);

for (const [key, value] of Object.entries(remoteInstancesHelper.services)) {
  if (value) {
    switch (key) {
      case 'postgresql':
        // TODO: https://jira.percona.com/browse/PMM-9011
        // qanFilters.add([remoteInstancesPage.potgresqlSettings.environment]);
        break;
      case 'mysql':
        qanFilters.add([remoteInstancesPage.mysqlSettings.environment]);
        break;
      case 'postgresGC':
        qanFilters.add([remoteInstancesPage.postgresGCSettings.environment]);
        break;
      case 'mongodb':
        qanFilters.add([remoteInstancesPage.mongodbSettings.environment]);
        break;
      case 'proxysql':
        break;
      default:
    }
    instances.add([key]);
  }
}

const azureServices = new DataTable(['name', 'instanceToMonitor']);

if (remoteInstancesHelper.getInstanceStatus('azure').azure_mysql.enabled) {
  azureServices.add(['azure-MySQL', 'pmm2-qa-mysql']);
  qanFilters.add([remoteInstancesPage.mysqlAzureInputs.environment]);
}

if (remoteInstancesHelper.getInstanceStatus('azure').azure_postgresql.enabled) {
  azureServices.add(['azure-PostgreSQL', 'pmm2-qa-postgresql']);
  qanFilters.add([remoteInstancesPage.postgresqlAzureInputs.environment]);
}

const aws_instances = new DataTable(['service_name', 'password', 'instance_id', 'cluster_name']);

aws_instances.add([
  remoteInstancesHelper.remote_instance.aws.aurora.aurora2.address,
  remoteInstancesHelper.remote_instance.aws.aurora.aurora2.password,
  remoteInstancesHelper.remote_instance.aws.aurora.aurora2.instance_id,
  remoteInstancesHelper.remote_instance.aws.aurora.aurora2.cluster_name,
]);
aws_instances.add([
  remoteInstancesHelper.remote_instance.aws.aurora.aurora3.address,
  remoteInstancesHelper.remote_instance.aws.aurora.aurora3.password,
  remoteInstancesHelper.remote_instance.aws.aurora.aurora3.instance_id,
  remoteInstancesHelper.remote_instance.aws.aurora.aurora3.cluster_name,
]);

const editActions = {
  set(testData) {
    this.data = testData;
  },
  mysql_remote_new() {
    return (this.data.mysqlSettings);
  },
  mongodb_remote_new() {
    return (this.data.mongodbSettings);
  },
  postgresql_remote_new() {
    return (this.data.potgresqlSettings);
  },
  proxysql_remote_new() {
    return (this.data.proxysqlSettings);
  },
  external_service_new() {
    return (this.data.externalSettings);
  },
  'rds-mysql56': function () {
    return (this.data.mysqlInputs);
  },
  'pmm-qa-mysql-8-0-30': function () {
    return (this.data.mysql80rdsInput);
  },
  'pmm-qa-rds-mysql-5-7-39': function () {
    return (this.data.mysql57rdsInput);
  },
  'pmm-qa-pgsql-12': function () {
    return (this.data.postgresqlInputs);
  },
  'azure-MySQL': function () {
    return (this.data.mysqlAzureInputs);
  },
  'azure-PostgreSQL': function () {
    return (this.data.postgresqlAzureInputs);
  },
  'pmm-qa-aurora2-mysql-instance-1': function () {
    return (this.data.postgresqlAzureInputs);
  },
  'pmm-qa-aurora3-mysql-instance-1': function () {
    return (this.data.postgresqlAzureInputs);
  },
  haproxy_remote() {
    return (this.data.haproxy);
  },
};

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

Data(instances).only.Scenario(
  'PMM-T2340 - Verify Remote Instances can be created and edited [critical] @inventory @inventory-fb',
  async ({
    I, pmmInventoryPage, current,
  }) => {
    const serviceName = remoteInstancesHelper.services[current.name];

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage(current.name);
    const inputs = await remoteInstancesPage.fillRemoteFields(serviceName);

    remoteInstancesPage.createRemoteInstance(serviceName);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(serviceName);

    const newLabels = {
      environment: `${inputs.environment} edited` || `${serviceName} environment edited`,
      cluster: `${inputs.cluster} edited` || `${serviceName} cluster edited`,
      replicationSet: `${inputs.replicationSet} edited` || `${serviceName} replicationSet edited`,
    };

    pmmInventoryPage.openEditServiceWizard(serviceName);
    pmmInventoryPage.updateServiceLabels(newLabels);
    I.click(pmmInventoryPage.fields.showServiceDetails(serviceName));
    pmmInventoryPage.verifyServiceLabels(newLabels);
  },
);

Scenario(
  'PMM-T2340 - Verify adding and editing external exporter service via UI @inventory @inventory-fb',
  async ({ I, remoteInstancesPage, pmmInventoryPage }) => {
    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage('external');
    await remoteInstancesPage.fillRemoteFields(externalExporterServiceName);
    I.waitForVisible(remoteInstancesPage.fields.addService, 30);
    I.click(remoteInstancesPage.fields.addService);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(externalExporterServiceName);
    editActions.set(testData);
    pmmInventoryPage.verifyEditRemoteService(externalExporterServiceName, editActions[externalExporterServiceName](testData));
  },
).retry(0);

Scenario(
  'PMM-T2340 - Verify adding and editing RDS instances [critical] @inventory @inventory-fb',
  async ({ I, remoteInstancesPage, pmmInventoryPage }) => {
    const serviceName = remoteInstancesPage.mysql57rds['Service Name'];

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded().openAddAWSRDSMySQLPage();
    remoteInstancesPage.discoverRDS();
    remoteInstancesPage.verifyInstanceIsDiscovered(serviceName);
    remoteInstancesPage.startMonitoringOfInstance(serviceName);
    remoteInstancesPage.verifyAddInstancePageOpened();
    remoteInstancesPage.fillRemoteRDSFields(serviceName);
    remoteInstancesPage.createRemoteInstance(serviceName);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(serviceName);
    editActions.set(testData);
    pmmInventoryPage.verifyEditRemoteService(serviceName, editActions[serviceName](testData));
  },
);

Scenario(
  '@PMM-T2340 - Verify Adding and Editing HAProxy service via UI @inventory @inventory-fb',
  async ({
    I, remoteInstancesPage, pmmInventoryPage,
  }) => {
    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded();
    remoteInstancesPage.openAddRemotePage('haproxy');
    I.waitForVisible(remoteInstancesPage.fields.hostName, 30);
    I.fillField(
      remoteInstancesPage.fields.hostName,
      remoteInstancesHelper.remote_instance.haproxy.haproxy_2.host,
    );
    I.fillField(remoteInstancesPage.fields.serviceName, haproxyServiceName);
    I.clearField(remoteInstancesPage.fields.portNumber);
    I.fillField(
      remoteInstancesPage.fields.portNumber,
      remoteInstancesHelper.remote_instance.haproxy.haproxy_2.port,
    );
    I.scrollPageToBottom();
    I.waitForVisible(remoteInstancesPage.fields.addService, 30);
    I.click(remoteInstancesPage.fields.addService);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(haproxyServiceName);
    editActions.set(testData, editActions[haproxyServiceName](testData));
    pmmInventoryPage.verifyEditRemoteService(haproxyServiceName, editActions[haproxyServiceName](testData));
  },
);

Scenario(
  'PMM-T2340 - Verify adding and editing PostgreSQL RDS monitoring to PMM via UI @inventory @inventory-fb',
  async ({
    I, remoteInstancesPage, pmmInventoryPage,
  }) => {
    const serviceName = 'pmm-qa-pgsql-12';

    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.waitUntilRemoteInstancesPageLoaded().openAddAWSRDSMySQLPage();
    remoteInstancesPage.discoverRDS();
    remoteInstancesPage.verifyInstanceIsDiscovered(serviceName);
    remoteInstancesPage.startMonitoringOfInstance(serviceName);
    remoteInstancesPage.verifyAddInstancePageOpened();
    const grabbedHostname = await I.grabValueFrom(remoteInstancesPage.fields.hostName);

    assert.ok(grabbedHostname.startsWith(serviceName), `Hostname is incorrect: ${grabbedHostname}`);
    I.seeInField(remoteInstancesPage.fields.serviceName, serviceName);
    remoteInstancesPage.fillRemoteRDSFields(serviceName);
    remoteInstancesPage.createRemoteInstance(serviceName);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(serviceName);
    editActions.set(testData, editActions[serviceName](testData));
    pmmInventoryPage.verifyEditRemoteService(serviceName, editActions[serviceName](testData));
  },
);

Data(azureServices).Scenario(
  'PMM-T2340 - Verify adding and editing monitoring for Azure @inventory @inventory-fb',
  async ({
    I, remoteInstancesPage, pmmInventoryPage, settingsAPI, current, inventoryAPI,
  }) => {
    const serviceName = current.name;

    await settingsAPI.enableAzure();
    I.amOnPage(remoteInstancesPage.url);
    remoteInstancesPage.openAddAzure();
    remoteInstancesPage.discoverAzure();
    remoteInstancesPage.startMonitoringOfInstance(current.instanceToMonitor);
    remoteInstancesPage.verifyAddInstancePageOpened();
    remoteInstancesPage.fillRemoteRDSFields(serviceName);
    I.click(remoteInstancesPage.fields.addService);
    pmmInventoryPage.verifyRemoteServiceIsDisplayed(serviceName);
    editActions.set(testData, editActions[serviceName](testData));
    pmmInventoryPage.verifyEditRemoteService(serviceName, editActions[serviceName](testData));
  },
);

Data(aws_instances).Scenario('PMM-T2340 Verify adding and editing Aurora remote instance @inventory @inventory-fb', async ({
  I, addInstanceAPI, inventoryAPI, current,
}) => {
  const {
    service_name, password, instance_id, cluster_name,
  } = current;

  const details = {
    add_node: {
      node_name: service_name,
      node_type: 'REMOTE_NODE',
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
  editActions.set(testData, editActions[details.service_name](testData));
  pmmInventoryPage.verifyEditRemoteService(details.service_name, editActions[details.service_name](testData));
});

Data(qanFilters).Scenario(
  'PMM-T2340 - Verify QAN after remote instance is added @inventory @inventory-fb',
  async ({
    I, qanOverview, qanFilters, qanPage, current,
  }) => {
    I.amOnPage(qanPage.url);
    qanOverview.waitForOverviewLoaded();
    await qanFilters.applyFilter(current.filterName);
    qanOverview.waitForOverviewLoaded();
    const count = await qanOverview.getCountOfItems();

    assert.ok(count > 0, `The queries for filter ${current.filterName} instance do NOT exist`);
  },
).retry(2);

Data(aws_instances).Scenario(
  'PMM-T2340 Verify QAN after Aurora instance is added and eidted @inventory @inventory-fb',
  async ({
    I, qanOverview, qanFilters, qanPage, current, adminPage,
  }) => {
    const { instance_id } = current;

    I.amOnPage(qanPage.url);
    qanOverview.waitForOverviewLoaded();
    await adminPage.applyTimeRange('Last 12 hours');
    qanOverview.waitForOverviewLoaded();
    qanFilters.waitForFiltersToLoad();
    await qanFilters.applySpecificFilter(instance_id);
    qanOverview.waitForOverviewLoaded();
    const count = await qanOverview.getCountOfItems();

    assert.ok(count > 0, `The queries for service ${instance_id} instance do NOT exist, check QAN Data`);
  },
).retry(1);
