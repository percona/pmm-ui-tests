const assert = require('assert');

Feature('MongoDB Collectors Parameters and Flags tests');

const collectionNames = ['col1', 'col2', 'col3', 'col4', 'col5'];
const dbNames = ['db1', 'db2', 'db3', 'db4'];
const connection = {
  host: '127.0.0.1',
  port: '27019',
  username: 'mongoadmin',
  password: 'secret',
};
const mongodb_service_name = 'mongodb_test_collections_flag';

const pmm_user_mongodb = {
  username: 'pmm_mongodb',
  password: 'secret',
};

const metrics = {
  collstats: 'mongodb_collstats_latencyStats_commands_latency',
  dbstats: 'mongodb_dbstats_collections',
  indexstats: 'mongodb_indexstats_accesses_ops',
  topmetrics: 'mongodb_top_ok',
};

BeforeSuite(async ({ I }) => {
  await I.mongoConnect(connection);
  for (let i = 0; i < dbNames.length; i++) {
    await I.mongoCreateBulkCollections(dbNames[i], collectionNames);
  }
});

Before(async ({ I }) => {
  await I.Authorize();
});

After(async ({ I }) => {
  await I.verifyCommand(`pmm-admin remove mongodb ${mongodb_service_name}`);
});

AfterSuite(async ({ I }) => {
  await I.mongoDisconnect();
});

Scenario(
  'PMM-T1208 - Verify metrics of MongoDB added with default flags',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    await I.say(await I.verifyCommand(`pmm-admin add mongodb --port=${connection.port} --agent-password='testing' --password=${pmm_user_mongodb.password} --username=${pmm_user_mongodb.username} --service-name=${mongodb_service_name} --replication-set=rs0s`));

    const { service_id, listen_port } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongodb_service_name);
    const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);

    // assert dbstats and topmetrics collectors are disabled
    // eslint-disable-next-line no-prototype-builtins
    assert.ok(!agentInfo.hasOwnProperty('enable_all_collectors'), `Was expecting enable_all_collectors to be disabled for Mongo Exporter for service "${mongodb_service_name}"`);
    I.say('Wait 60 seconds for Metrics being collected for the new service');
    await I.wait(60);
    await grafanaAPI.checkMetricAbsent(metrics.dbstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricAbsent(metrics.collstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricAbsent(metrics.topmetrics, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricAbsent(metrics.indexstats, { type: 'service_name', value: mongodb_service_name });
  },
);

Scenario(
  'PMM-T1209 - Verify metrics of MongoDB with --disable-collectors=topmetrics and --enable-all-collectors were specified',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    await I.say(await I.verifyCommand(`pmm-admin add mongodb --port=${connection.port} --agent-password='testing' --password=${pmm_user_mongodb.password} --username=${pmm_user_mongodb.username} --enable-all-collectors  --disable-collectors=topmetrics --service-name=${mongodb_service_name} --replication-set=rs0s`));

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongodb_service_name);
    const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);

    // assert dbstats and topmetrics collectors are enabled
    // eslint-disable-next-line no-prototype-builtins
    assert.ok(agentInfo.hasOwnProperty('enable_all_collectors'), `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "enable_all_collectors" property`);
    // eslint-disable-next-line no-prototype-builtins
    assert.ok(agentInfo.hasOwnProperty('disabled_collectors'), `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "enable_all_collectors" property`);
    // eslint-disable-next-line no-prototype-builtins
    assert.ok(agentInfo.disabled_collectors[0] === 'topmetrics', `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "disabled_collectors: [ 'topmetrics' ]" property`);
    assert.ok(agentInfo.disabled_collectors.length === 1, `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "disabled_collectors: [ 'topmetrics' ]" property`);
    assert.ok(agentInfo.enable_all_collectors, `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "enable_all_collectors" property with "true"`);
    I.say('Wait 60 seconds for Metrics being collected for the new service');
    await I.wait(60);
    await grafanaAPI.checkMetricExist(metrics.dbstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricExist(metrics.collstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricExist(metrics.indexstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricAbsent(metrics.topmetrics, { type: 'service_name', value: mongodb_service_name });
  },
);

//
// Scenario(
//   'PMM-T1210 - Verify metrics of MongoDB with "--enable-all-collectors" was specified',
//   async ({ I, inventoryAPI, grafanaAPI }) => {
//     const mongoServiceName = 'mongo-all2';
//
//     await I.say(await I.verifyCommand(`pmm-admin add mongodb --port=27027 --service-name=${mongoServiceName} --replication-set=rs0 --enable-all-collectors`));
//
//     const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);
//     const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);
//
//     // assert dbstats and topmetrics collectors are enabled
//     I.assertTrue(agentInfo.hasOwnProperty('enable_all_collectors'), `Was expecting Mongo Exporter "${agentInfo.agent_id}" to have "enable_all_collectors" property`);
//     I.assertTrue(agentInfo.enable_all_collectors, `Was expecting Mongo Exporter "${agentInfo.agent_id}" to have "enable_all_collectors" property with "true"`);
//     await grafanaAPI.checkMetricExist('mongodb_dbstats_collections', { type: 'service_name', value: mongoServiceName });
//     await grafanaAPI.checkMetricExist('mongodb_top_ok', { type: 'service_name', value: mongoServiceName });
//
//     await I.say(await I.verifyCommand(`pmm-admin remove mongodb --service-name=${mongoServiceName}`));
//   },
// );
//
// Scenario(
//   'PMM-T1211 - Verify metrics of MongoDB with --disable-collectors="topmetrics" and --enable-all-collectors were specified',
//   async ({ I, inventoryAPI, grafanaAPI }) => {
//     const mongoServiceName = 'mongo-all-with-dis';
//
//     await I.say(await I.verifyCommand(`pmm-admin add mongodb --port=27027 --service-name=${mongoServiceName} --replication-set=rs0 --disable-collectors="topmetrics" --enable-all-collectors`));
//
//     const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongoServiceName);
//     const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);
//
//     // assert  all collectors (dbstats, getDiagnosticdata, etc) are enabled except topmetrics
//     I.assertTrue(agentInfo.hasOwnProperty('enable_all_collectors'), `Was expecting Mongo Exporter "${agentInfo.agent_id}" to have "enable_all_collectors" property`);
//     I.assertTrue(agentInfo.enable_all_collectors, `Was expecting Mongo Exporter "${agentInfo.agent_id}" to have "enable_all_collectors" property with "true"`);
//     await grafanaAPI.checkMetricExist('mongodb_dbstats_collections', { type: 'service_name', value: mongoServiceName });
//     await grafanaAPI.checkMetricAbsent('mongodb_top_ok', { type: 'service_name', value: mongoServiceName });
//
//     await I.say(await I.verifyCommand(`pmm-admin remove mongodb --service-name=${mongoServiceName}`));
//   },
// );
//
// Scenario(
//   'PMM-T1212 - Verify metrics of MongoDB with --disable-collectors="replicasetstatus" was specified',
//   async ({ I, inventoryAPI, grafanaAPI }) => {
//     const mongoServiceName = 'mongo-dis';
//
//     await I.say(await I.verifyCommand(`pmm-admin add mongodb --port=27027 --service-name=${mongoServiceName} --replication-set=rs0 --disable-collectors="replicasetstatus"`));
//
//     // assert only diagnosticdata enabled.
//     await grafanaAPI.checkMetricExist('mongodb_memory', { type: 'service_name', value: mongoServiceName });
//     await grafanaAPI.checkMetricAbsent('mongodb_dbstats_collections', { type: 'service_name', value: mongoServiceName });
//     await grafanaAPI.checkMetricAbsent('mongodb_top_ok', { type: 'service_name', value: mongoServiceName });
//
//     await I.say(await I.verifyCommand(`pmm-admin remove mongodb --service-name=${mongoServiceName}`));
//   },
// );
//
// Scenario(
//   'PMM-T1213 - Verify metrics of MongoDB with --stats-collections=db1,db2.col2 specified',
//   async ({ I, inventoryAPI, grafanaAPI }) => {
//     const mongoServiceName = 'mongo-coll1';
//
//     await I.say(await I.verifyCommand(`pmm-admin add mongodb --port=27027 --service-name=${mongoServiceName} --replication-set=rs0 --stats-collections=db1,db2.col2`));
//
//     // assert stats for ALL collections in db1 and stats for db2.col2
//     // await grafanaAPI.checkMetricExist('db1.col1');
//     // await grafanaAPI.checkMetricExist('db1.col2');
//     // await grafanaAPI.checkMetricExist('db1.col3');
//     // await grafanaAPI.checkMetricAbsent('db2.col1');
//     // await grafanaAPI.checkMetricExist('db2.col2');
//     // await grafanaAPI.checkMetricAbsent('db2.col3');
//     // await grafanaAPI.checkMetricAbsent('db3.col1');
//
//     await I.say(await I.verifyCommand(`pmm-admin remove mongodb --service-name=${mongoServiceName}`));
//   },
// );
