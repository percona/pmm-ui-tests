Feature('BM: Backup Inventory');

BeforeSuite(async ({ I }) => {
  await I.mongoConnectReplica({
    username: 'admin',
    password: 'password',
  });
  let col = await I.mongoCreateCollection('db1', 'col1');

  await col.insertOne({ a: 'db1-col1' });

  col = await I.mongoCreateCollection('db1', 'col2');

  await col.insertOne({ a: 'db1-col2' });

  col = await I.mongoCreateCollection('db1', 'col3');

  await col.insertOne({ a: 'db1-col3' });

  col = await I.mongoCreateCollection('db2', 'col1');

  await col.insertOne({ a: 'db2-col1' });

  col = await I.mongoCreateCollection('db2', 'col2');

  await col.insertOne({ a: 'db2-col2' });

  col = await I.mongoCreateCollection('db2', 'col3');

  await col.insertOne({ a: 'db2-col3' });

  col = await I.mongoCreateCollection('db3', 'col1');

  await col.insertOne({ a: 'db3-col1' });

  col = await I.mongoCreateCollection('db4', 'col1');

  await col.insertOne({ a: 'db4-col1' });

  col = await I.mongoCreateCollection('db5', 'col1');

  await col.insertOne({ a: 'db5-col1' });
});

Before(async ({ I }) => {
  await I.Authorize();
});

AfterSuite(async ({ I }) => {
  await I.mongoDisconnect();
});

Scenario(
  'PMM-T000 Verify MongoDB added with defaults',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    const mongoServiceName = 'mongo-def';

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
  async ({ I, inventoryAPI, grafanaAPI }) => {
    const mongoServiceName = 'mongo-all1';

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
  async ({ I, inventoryAPI, grafanaAPI }) => {
    const mongoServiceName = 'mongo-all2';

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
  async ({ I, inventoryAPI, grafanaAPI }) => {
    const mongoServiceName = 'mongo-all-with-dis';

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
  async ({ I, inventoryAPI, grafanaAPI }) => {
    const mongoServiceName = 'mongo-dis';

    I.say(await I.verifyCommand(`pmm-admin add mongodb --port=27027 --service-name=${mongoServiceName} --replication-set=rs0 --disable-collectors="replicasetstatus"`));

    // assert only diagnosticdata enabled.
    await grafanaAPI.checkMetricExist('mongodb_memory', { type: 'service_name', value: mongoServiceName });
    const response1 = await grafanaAPI.checkMetricExist('mongodb_dbstats_collections', { type: 'service_name', value: mongoServiceName });
    const response2 = await grafanaAPI.checkMetricExist('mongodb_top_ok', { type: 'service_name', value: mongoServiceName });

    I.assertEqual(response1.data.data.result.length, 0);
    I.assertEqual(response2.data.data.result.length, 0);
    // console.log(JSON.stringify(response.data.data,null,2));
  },
);

Scenario(
  'PMM-T000 Verify MongoDB with --stats-collections=db1,db2.col2 specified @imp',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    // const mongoServiceName = 'mongo-coll1';
    const mongoServiceName = 'mongo-c';

    I.say(await I.verifyCommand(`pmm-admin add mongodb --port=27027 --service-name=${mongoServiceName} --replication-set=rs0 --stats-collections=db1,db2.col2`));

    // assert stats for ALL collections in db1 and stats for db2.col2
  },
);
