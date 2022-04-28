let serviceId;

const mongoServiceName = 'mongo-dis'; //move to the test cases with own names

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
  'PMM-T000 Verify MongoDB added with defaults',
  async ({
           I, inventoryAPI, grafanaAPI,
         }) => {
    I.say(await I.verifyCommand(`pmm-admin add mongodb --port=27027 --service-name=${mongoServiceName} --replication-set=rs0s`));

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);
    const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);

    // assert dbstats and topmetrics collectors are disabled
    I.assertFalse(agentInfo.hasOwnProperty('enable_all_collectors'), `Was expecting Mongo Exporter "${agentInfo.agent_id}" to have "enable_all_collectors" property`);

    const response1 = await grafanaAPI.checkMetricExist('mongodb_dbstats_collections', { type: 'service_name', value: mongoServiceName });
    const response2 = await grafanaAPI.checkMetricExist('mongodb_top_ok', { type: 'service_name', value: mongoServiceName });
    I.assertEqual(response1.data.data.result.length, 0);
    I.assertEqual(response2.data.data.result.length, 0);
  },
);

Scenario(
  'PMM-T000 Verify MongoDB with --disable-collectors="" and --enable-all-collectors  were specified',
  async ({
    I, inventoryAPI, grafanaAPI,
  }) => {
    I.say(await I.verifyCommand(`pmm-admin add mongodb --port=27027 --service-name=${mongoServiceName} --replication-set=rs0 --enable-all-collectors`));

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);
    const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);

    // assert dbstats and topmetrics collectors are enabled
    I.assertTrue(agentInfo.hasOwnProperty('enable_all_collectors'), `Was expecting Mongo Exporter "${agentInfo.agent_id}" to have "enable_all_collectors" property`);
    I.assertTrue(agentInfo.enable_all_collectors, `Was expecting Mongo Exporter "${agentInfo.agent_id}" to have "enable_all_collectors" property with "true"`);

    await grafanaAPI.checkMetricExist('mongodb_dbstats_collections', { type: 'service_name', value: mongoServiceName });
    await grafanaAPI.checkMetricExist('mongodb_top_ok', { type: 'service_name', value: mongoServiceName });
  },
);

Scenario(
  'PMM-T000 Verify MongoDB with "--enable-all-collectors" was specified',
  async ({
           I, inventoryAPI, grafanaAPI,
         }) => {
    I.say(await I.verifyCommand(`pmm-admin add mongodb --port=27027 --service-name=${mongoServiceName} --replication-set=rs0 --disable-collectors="" --enable-all-collectors`));

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);
    const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);

    // assert dbstats and topmetrics collectors are enabled
    I.assertTrue(agentInfo.hasOwnProperty('enable_all_collectors'), `Was expecting Mongo Exporter "${agentInfo.agent_id}" to have "enable_all_collectors" property`);
    I.assertTrue(agentInfo.enable_all_collectors, `Was expecting Mongo Exporter "${agentInfo.agent_id}" to have "enable_all_collectors" property with "true"`);

    await grafanaAPI.checkMetricExist('mongodb_dbstats_collections', { type: 'service_name', value: mongoServiceName });
    await grafanaAPI.checkMetricExist('mongodb_top_ok', { type: 'service_name', value: mongoServiceName });
  },
);

Scenario(
  'PMM-T000 Verify MongoDB with --disable-collectors="topmetrics" and --enable-all-collectors  were specified',
  async ({
           I, inventoryAPI, grafanaAPI,
         }) => {
    I.say(await I.verifyCommand(`pmm-admin add mongodb --port=27027 --service-name=${mongoServiceName} --replication-set=rs0 --disable-collectors="topmetrics" --enable-all-collectors`));

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);
    const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);

    // assert  all collectors (dbstats, getDiagnosticdata, etc) are enabled except topmetrics
    I.assertTrue(agentInfo.hasOwnProperty('enable_all_collectors'), `Was expecting Mongo Exporter "${agentInfo.agent_id}" to have "enable_all_collectors" property`);
    I.assertTrue(agentInfo.enable_all_collectors, `Was expecting Mongo Exporter "${agentInfo.agent_id}" to have "enable_all_collectors" property with "true"`);

    await grafanaAPI.checkMetricExist('mongodb_dbstats_collections', { type: 'service_name', value: mongoServiceName });
    const response2 = await grafanaAPI.checkMetricExist('mongodb_top_ok', { type: 'service_name', value: mongoServiceName });
    I.assertEqual(response2.data.data.result.length, 0);
    // console.log(JSON.stringify(response.data.data,null,2));
  },
);

Scenario(
  'PMM-T000 Verify MongoDB with --disable-collectors="replicasetstatus" was specified',
  async ({
           I, inventoryAPI, grafanaAPI,
         }) => {
    I.say(await I.verifyCommand(`pmm-admin add mongodb --port=27027 --service-name=${mongoServiceName} --replication-set=rs0 --disable-collectors="replicasetstatus"`));

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);
    const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);

    // assert only diagnosticdata enabled.
    await grafanaAPI.checkMetricExist('mongodb_memory', { type: 'service_name', value: mongoServiceName });
    const response1 = await grafanaAPI.checkMetricExist('mongodb_dbstats_collections', { type: 'service_name', value: mongoServiceName });
    const response2 = await grafanaAPI.checkMetricExist('mongodb_top_ok', { type: 'service_name', value: mongoServiceName });
    I.assertEqual(response1.data.data.result.length, 0);
    I.assertEqual(response2.data.data.result.length, 0);
    // console.log(JSON.stringify(response.data.data,null,2));
  },
);

//   Case 6. Filtering discovering mode
// Scenario	Adding a new MongoDB instance
// When	Adding a new instance via pmm-admin add mongodb
// And	--stats-collections was specified with at least one collection name in the form of <db>.<collection>
//   Then	A new MongoDB instance is added and discovering-mode should be enabled but only namespaces
//   in --stats-collections should be considered.
//   Example: --stats-collections=db1,db2.col2 must get stats for ALL collections in db1 and stats for db2.col2

