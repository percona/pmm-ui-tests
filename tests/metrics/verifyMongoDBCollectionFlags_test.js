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
  'PMM-T1208 - Verify metrics of MongoDB added with default flags',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    const mongoServiceName = 'mongo-def';

    await I.say(await I.verifyCommand(`pmm-admin add mongodb --port=27027 --service-name=${mongoServiceName} --replication-set=rs0s`));

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);
    const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);

    // assert dbstats and topmetrics collectors are disabled
    I.assertFalse(agentInfo.hasOwnProperty('enable_all_collectors'), `Was expecting Mongo Exporter "${agentInfo.agent_id}" to have no "enable_all_collectors" property`);
    await grafanaAPI.checkMetricAbsent('mongodb_dbstats_collections', { type: 'service_name', value: mongoServiceName });
    await grafanaAPI.checkMetricAbsent('mongodb_top_ok', { type: 'service_name', value: mongoServiceName });

    await I.say(await I.verifyCommand(`pmm-admin remove mongodb --service-name=${mongoServiceName}`));
  },
);

Scenario(
  'PMM-T1209 - Verify metrics of MongoDB with --disable-collectors="" and --enable-all-collectors were specified',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    const mongoServiceName = 'mongo-all1';

    await I.say(await I.verifyCommand(`pmm-admin add mongodb --port=27027 --service-name=${mongoServiceName} --replication-set=rs0 --enable-all-collectors  --disable-collectors="" `));

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);
    const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);

    // assert dbstats and topmetrics collectors are enabled
    I.assertTrue(agentInfo.hasOwnProperty('enable_all_collectors'), `Was expecting Mongo Exporter "${agentInfo.agent_id}" to have "enable_all_collectors" property`);
    I.assertTrue(agentInfo.enable_all_collectors, `Was expecting Mongo Exporter "${agentInfo.agent_id}" to have "enable_all_collectors" property with "true"`);
    await grafanaAPI.checkMetricExist('mongodb_dbstats_collections', { type: 'service_name', value: mongoServiceName });
    await grafanaAPI.checkMetricExist('mongodb_top_ok', { type: 'service_name', value: mongoServiceName });

    await I.say(await I.verifyCommand(`pmm-admin remove mongodb --service-name=${mongoServiceName}`));
  },
);

Scenario(
  'PMM-T1210 - Verify metrics of MongoDB with "--enable-all-collectors" was specified',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    const mongoServiceName = 'mongo-all2';

    await I.say(await I.verifyCommand(`pmm-admin add mongodb --port=27027 --service-name=${mongoServiceName} --replication-set=rs0 --enable-all-collectors`));

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);
    const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);

    // assert dbstats and topmetrics collectors are enabled
    I.assertTrue(agentInfo.hasOwnProperty('enable_all_collectors'), `Was expecting Mongo Exporter "${agentInfo.agent_id}" to have "enable_all_collectors" property`);
    I.assertTrue(agentInfo.enable_all_collectors, `Was expecting Mongo Exporter "${agentInfo.agent_id}" to have "enable_all_collectors" property with "true"`);
    await grafanaAPI.checkMetricExist('mongodb_dbstats_collections', { type: 'service_name', value: mongoServiceName });
    await grafanaAPI.checkMetricExist('mongodb_top_ok', { type: 'service_name', value: mongoServiceName });

    await I.say(await I.verifyCommand(`pmm-admin remove mongodb --service-name=${mongoServiceName}`));
  },
);

Scenario(
  'PMM-T1211 - Verify metrics of MongoDB with --disable-collectors="topmetrics" and --enable-all-collectors were specified',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    const mongoServiceName = 'mongo-all-with-dis';

    await I.say(await I.verifyCommand(`pmm-admin add mongodb --port=27027 --service-name=${mongoServiceName} --replication-set=rs0 --disable-collectors="topmetrics" --enable-all-collectors`));

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);
    const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);

    // assert  all collectors (dbstats, getDiagnosticdata, etc) are enabled except topmetrics
    I.assertTrue(agentInfo.hasOwnProperty('enable_all_collectors'), `Was expecting Mongo Exporter "${agentInfo.agent_id}" to have "enable_all_collectors" property`);
    I.assertTrue(agentInfo.enable_all_collectors, `Was expecting Mongo Exporter "${agentInfo.agent_id}" to have "enable_all_collectors" property with "true"`);
    await grafanaAPI.checkMetricExist('mongodb_dbstats_collections', { type: 'service_name', value: mongoServiceName });
    await grafanaAPI.checkMetricAbsent('mongodb_top_ok', { type: 'service_name', value: mongoServiceName });

    await I.say(await I.verifyCommand(`pmm-admin remove mongodb --service-name=${mongoServiceName}`));
  },
);

Scenario(
  'PMM-T1212 - Verify metrics of MongoDB with --disable-collectors="replicasetstatus" was specified',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    const mongoServiceName = 'mongo-dis';

    await I.say(await I.verifyCommand(`pmm-admin add mongodb --port=27027 --service-name=${mongoServiceName} --replication-set=rs0 --disable-collectors="replicasetstatus"`));

    // assert only diagnosticdata enabled.
    await grafanaAPI.checkMetricExist('mongodb_memory', { type: 'service_name', value: mongoServiceName });
    await grafanaAPI.checkMetricAbsent('mongodb_dbstats_collections', { type: 'service_name', value: mongoServiceName });
    await grafanaAPI.checkMetricAbsent('mongodb_top_ok', { type: 'service_name', value: mongoServiceName });

    await I.say(await I.verifyCommand(`pmm-admin remove mongodb --service-name=${mongoServiceName}`));
  },
);

Scenario(
  'PMM-T1213 - Verify metrics of MongoDB with --stats-collections=db1,db2.col2 specified',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    const mongoServiceName = 'mongo-coll1';

    await I.say(await I.verifyCommand(`pmm-admin add mongodb --port=27027 --service-name=${mongoServiceName} --replication-set=rs0 --stats-collections=db1,db2.col2`));

    // assert stats for ALL collections in db1 and stats for db2.col2
    // await grafanaAPI.checkMetricExist('db1.col1');
    // await grafanaAPI.checkMetricExist('db1.col2');
    // await grafanaAPI.checkMetricExist('db1.col3');
    // await grafanaAPI.checkMetricAbsent('db2.col1');
    // await grafanaAPI.checkMetricExist('db2.col2');
    // await grafanaAPI.checkMetricAbsent('db2.col3');
    // await grafanaAPI.checkMetricAbsent('db3.col1');

    await I.say(await I.verifyCommand(`pmm-admin remove mongodb --service-name=${mongoServiceName}`));
  },
);
