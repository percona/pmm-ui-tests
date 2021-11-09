const assert = require('assert');
const faker = require('faker');

const pmmManagerCmd = 'bash /srv/pmm-qa/pmm-tests/pmm-framework.sh --pmm2';
const mysqlServiceName = `mysql-push-mode-${faker.datatype.number()}`;
const postgresServiceName = `postgres-push-mode-${faker.datatype.number()}`;
const mongoServiceName = `mongo-push-mode-${faker.datatype.number()}`;

const services = new DataTable(['serviceName']);

services.add([mysqlServiceName]);
services.add([postgresServiceName]);
services.add([mongoServiceName]);
services.add(['haproxy']);

Feature('Inventory page');

BeforeSuite(async ({ I }) => {
  I.say(await I.verifyCommand(`${pmmManagerCmd} --addclient=ps,1 --deploy-service-with-name ${mysqlServiceName}`));
  I.say(await I.verifyCommand(`${pmmManagerCmd} --addclient=pdpgsql,1 --deploy-service-with-name ${postgresServiceName}`));
  I.say(await I.verifyCommand(`${pmmManagerCmd} --addclient=modb,1 --deploy-service-with-name ${mongoServiceName}`));
});

AfterSuite(async ({ I }) => {
  I.say(await I.verifyCommand(`${pmmManagerCmd} --cleanup-service ${mysqlServiceName}`));
  I.say(await I.verifyCommand(`${pmmManagerCmd} --cleanup-service ${postgresServiceName}`));
  I.say(await I.verifyCommand(`${pmmManagerCmd} --cleanup-service ${mongoServiceName}`));
});

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
  async ({ pmmInventoryPage }) => {
    pmmInventoryPage.openAgentsPage();
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
  async ({ I, pmmInventoryPage }) => {
    const agentType = 'MySQL exporter';

    I.amOnPage(pmmInventoryPage.url);
    I.waitForVisible(pmmInventoryPage.fields.nodesLink, 20);
    I.click(pmmInventoryPage.fields.nodesLink);
    const countOfNodesBefore = await pmmInventoryPage.getNodeCount();

    pmmInventoryPage.openAgentsPage();
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

Scenario(
  'PMM-T345 - Verify removing pmm-agent on PMM Inventory page removes all associated agents @inventory',
  async ({ pmmInventoryPage }) => {
    const agentID = 'pmm-server';
    const agentType = 'PMM Agent';

    pmmInventoryPage.openAgentsPage();
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
  async ({ pmmInventoryPage, inventoryAPI }) => {
    const statuses = ['WAITING', 'STARTING', 'UNKNOWN'];
    const serviceIdsNotRunning = [];
    const servicesNotRunning = [];

    pmmInventoryPage.openAgentsPage();

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

Data(services).Scenario(
  'PMM-T1072 - Verify "push_metrics" enabled by default on DB Exporters in Inventory page(Agents tab) @inventory',
  async ({
    pmmInventoryPage, inventoryAPI, current, remoteInstancesHelper,
  }) => {
    let name = current.serviceName;

    if (name === 'haproxy') {
      const haproxyService = await inventoryAPI.apiGetServices(remoteInstancesHelper.services.haproxy.serviceType);

      /* expected array with single object, even if multiple returned - only one required for test */
      name = haproxyService.data.haproxy[0].service_name;
    }

    const id = await inventoryAPI.getServiceId(name);

    pmmInventoryPage.openAgentsPage();
    await pmmInventoryPage.verifyExporterPushModeMetrics(id);
  },
);
