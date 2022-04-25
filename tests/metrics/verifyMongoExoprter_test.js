let serviceId;

const mongoServiceName = 'mongo-rs';

Feature('BM: Backup Inventory');

BeforeSuite(async ({ I }) => {
  await I.mongoConnectReplica({
    username: 'admin',
    password: 'password',
  });
});

Before(async ({ I, inventoryAPI }) => {
  const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);

  serviceId = service_id;

  const c = await I.mongoGetCollection('test', 'e2e');

  await c.deleteMany({ number: 2 });

  await I.Authorize();
});

AfterSuite(async ({ I }) => {
  await I.mongoDisconnect();
});

Scenario(
  'PMM-T000 Verify MongoDB with "--enable-all-collectors" was specified @imp',
  async ({
    I, inventoryAPI, scheduledAPI,
  }) => {
    // When Adding a new instance via pmm-admin add mongodb and --enable-all-collectors was specified
    I.say(await I.verifyCommand(`pmm-admin add mongodb --port=27027 --service-name=${mongoServiceName} --replication-set=rs0 --enable-all-collectors`));

    // Then A new MongoDB instance is added and dbstats and topmetrics collectors are enabled
    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);
    const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);

    // assert dbstats and topmetrics collectors are enabled
    I.assertTrue(agentInfo.hasOwnProperty('enable_all_collectors'), `Was expecting Mongo Exporter "${agentInfo.agent_id}" to have "enable_all_collectors" property`);
    I.assertTrue(agentInfo.enable_all_collectors, `Was expecting Mongo Exporter "${agentInfo.agent_id}" to have "enable_all_collectors" property with "true"`);
  },
);
