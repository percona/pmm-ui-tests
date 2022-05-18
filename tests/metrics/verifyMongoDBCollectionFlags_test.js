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
  topmetrics: 'mongodb_top_total_count',
  diagnosticdata: 'mongodb_ss_metrics_commands_getDiagnosticData_total',
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

Scenario(
  'PMM-T1210 - Verify metrics of MongoDB with "--enable-all-collectors" was specified',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    await I.say(await I.verifyCommand(`pmm-admin add mongodb --port=${connection.port} --agent-password='testing' --password=${pmm_user_mongodb.password} --username=${pmm_user_mongodb.username} --enable-all-collectors --service-name=${mongodb_service_name} --replication-set=rs0s`));

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongodb_service_name);
    const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);

    // assert dbstats and topmetrics collectors are enabled
    // eslint-disable-next-line no-prototype-builtins
    assert.ok(agentInfo.hasOwnProperty('enable_all_collectors'), `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "enable_all_collectors" property`);
    assert.ok(agentInfo.enable_all_collectors, `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "enable_all_collectors" property with "true"`);
    I.say('Wait 60 seconds for Metrics being collected for the new service');
    await I.wait(60);
    await grafanaAPI.checkMetricExist(metrics.dbstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricExist(metrics.collstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricExist(metrics.indexstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricExist(metrics.topmetrics, { type: 'service_name', value: mongodb_service_name });
  },
);

Scenario(
  'PMM-T1211 - Verify metrics of MongoDB with --disable-collectors="" and --enable-all-collectors were specified',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    await I.say(await I.verifyCommand(`pmm-admin add mongodb --port=${connection.port} --agent-password='testing' --password=${pmm_user_mongodb.password} --username=${pmm_user_mongodb.username} --enable-all-collectors  --disable-collectors="" --service-name=${mongodb_service_name} --replication-set=rs0s`));

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongodb_service_name);
    const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);

    console.log(agentInfo);

    // assert dbstats and topmetrics collectors are enabled
    // eslint-disable-next-line no-prototype-builtins
    assert.ok(agentInfo.hasOwnProperty('enable_all_collectors'), `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "enable_all_collectors" property`);
    assert.ok(agentInfo.enable_all_collectors, `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "enable_all_collectors" property with "true"`);
    I.say('Wait 60 seconds for Metrics being collected for the new service');
    await I.wait(60);
    await grafanaAPI.checkMetricExist(metrics.dbstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricExist(metrics.collstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricExist(metrics.indexstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricExist(metrics.topmetrics, { type: 'service_name', value: mongodb_service_name });
  },
);

Scenario(
  'PMM-T1212 - Verify metrics of MongoDB with --disable-collectors="collstats,dbstats,topmetrics" was specified',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    await I.say(await I.verifyCommand(`pmm-admin add mongodb --port=${connection.port} --agent-password='testing' --password=${pmm_user_mongodb.password} --username=${pmm_user_mongodb.username} --enable-all-collectors  --disable-collectors="collstats,dbstats,topmetrics" --service-name=${mongodb_service_name} --replication-set=rs0s`));

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongodb_service_name);
    const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);

    // assert dbstats and topmetrics collectors are enabled
    // eslint-disable-next-line no-prototype-builtins
    assert.ok(agentInfo.hasOwnProperty('enable_all_collectors'), `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "enable_all_collectors" property`);
    // eslint-disable-next-line no-prototype-builtins
    assert.ok(agentInfo.hasOwnProperty('disabled_collectors'), `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "enable_all_collectors" property`);
    // eslint-disable-next-line no-prototype-builtins
    assert.ok(agentInfo.disabled_collectors[0] === 'collstats', `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "disabled_collectors: [ 'collstats', 'dbstats', 'topmetrics' ]" property but found ${agentInfo.disabled_collectors}`);
    assert.ok(agentInfo.disabled_collectors[1] === 'dbstats', `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "disabled_collectors: [ 'collstats', 'dbstats', 'topmetrics' ]" property but found ${agentInfo.disabled_collectors}`);
    assert.ok(agentInfo.disabled_collectors[2] === 'topmetrics', `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "disabled_collectors: [ 'collstats', 'dbstats', 'topmetrics' ]" property but found ${agentInfo.disabled_collectors}`);
    assert.ok(agentInfo.disabled_collectors.length === 3, `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "disabled_collectors: [ 'collstats', 'dbstats', 'topmetrics' ]" property but found ${agentInfo.disabled_collectors}`);
    assert.ok(agentInfo.enable_all_collectors, `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "enable_all_collectors" property with "true"`);
    I.say('Wait 60 seconds for Metrics being collected for the new service');
    await I.wait(60);
    await grafanaAPI.checkMetricAbsent(metrics.dbstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricAbsent(metrics.collstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricExist(metrics.indexstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricAbsent(metrics.topmetrics, { type: 'service_name', value: mongodb_service_name });
  },
);

Scenario(
  'PMM-T1213 - Verify metrics of MongoDB with --stats-collections=db1,db2.col2 specified',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    await I.say(await I.verifyCommand(`pmm-admin add mongodb --port=${connection.port} --agent-password='testing' --password=${pmm_user_mongodb.password} --username=${pmm_user_mongodb.username} --enable-all-collectors --stats-collections=db1,db2.col2 --service-name=${mongodb_service_name} --replication-set=rs0s`));

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongodb_service_name);
    const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);

    // assert dbstats and topmetrics collectors are enabled
    // eslint-disable-next-line no-prototype-builtins
    assert.ok(agentInfo.hasOwnProperty('enable_all_collectors'), `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "enable_all_collectors" property`);
    // eslint-disable-next-line no-prototype-builtins
    assert.ok(agentInfo.enable_all_collectors, `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "enable_all_collectors" property with "true"`);
    I.say('Wait 60 seconds for Metrics being collected for the new service');
    await I.wait(60);
    await grafanaAPI.checkMetricExist(metrics.dbstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricExist(metrics.collstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricExist(metrics.indexstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricExist(metrics.topmetrics, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricExist(metrics.topmetrics, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricExist(metrics.collstats, [{ type: 'service_name', value: mongodb_service_name }, { type: 'database', value: 'db1' }]);
    await grafanaAPI.checkMetricAbsent(metrics.collstats, [{ type: 'service_name', value: mongodb_service_name }, { type: 'database', value: 'db3' }, { type: 'collection', value: 'col3' }]);
    await grafanaAPI.checkMetricAbsent(metrics.collstats, [{ type: 'service_name', value: mongodb_service_name }, { type: 'database', value: 'db2' }, { type: 'collection', value: 'col1' }]);
    await grafanaAPI.checkMetricExist(metrics.collstats, [{ type: 'service_name', value: mongodb_service_name }, { type: 'database', value: 'db2' }, { type: 'collection', value: 'col2' }]);
  },
);

Scenario(
  'PMM-T1213 - Verify metrics of MongoDB with --stats-collections=db1,db2.col2 & --max-collections-limit=5 specified',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    await I.say(await I.verifyCommand(`pmm-admin add mongodb --port=${connection.port} --agent-password='testing' --password=${pmm_user_mongodb.password} --username=${pmm_user_mongodb.username} --enable-all-collectors --max-collections-limit=5 --stats-collections=db1,db2.col2 --service-name=${mongodb_service_name} --replication-set=rs0s`));

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongodb_service_name);
    const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);

    // assert dbstats and topmetrics collectors are enabled
    // eslint-disable-next-line no-prototype-builtins
    assert.ok(agentInfo.hasOwnProperty('enable_all_collectors'), `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "enable_all_collectors" property`);
    // eslint-disable-next-line no-prototype-builtins
    assert.ok(agentInfo.enable_all_collectors, `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "enable_all_collectors" property with "true"`);
    I.say('Wait 60 seconds for Metrics being collected for the new service');
    await I.wait(60);
    await grafanaAPI.checkMetricAbsent(metrics.dbstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricAbsent(metrics.collstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricAbsent(metrics.indexstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricAbsent(metrics.topmetrics, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricAbsent(metrics.topmetrics, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricAbsent(metrics.collstats, [{ type: 'service_name', value: mongodb_service_name }, { type: 'database', value: 'db1' }]);
    await grafanaAPI.checkMetricAbsent(metrics.collstats, [{ type: 'service_name', value: mongodb_service_name }, { type: 'database', value: 'db3' }, { type: 'collection', value: 'col3' }]);
    await grafanaAPI.checkMetricAbsent(metrics.collstats, [{ type: 'service_name', value: mongodb_service_name }, { type: 'database', value: 'db2' }, { type: 'collection', value: 'col1' }]);
    await grafanaAPI.checkMetricAbsent(metrics.collstats, [{ type: 'service_name', value: mongodb_service_name }, { type: 'database', value: 'db2' }, { type: 'collection', value: 'col2' }]);
  },
);
