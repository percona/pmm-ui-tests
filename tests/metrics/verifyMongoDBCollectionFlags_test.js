const assert = require('assert');

Feature('MongoDB Collectors Parameters and Flags tests');

const collectionNames = ['col1', 'col2', 'col3', 'col4', 'col5'];
const dbNames = ['db1', 'db2', 'db3', 'db4'];
const connection = {
  host: '127.0.0.1',
  // eslint-disable-next-line no-inline-comments
  port: '27027', // This is the port used by --database psmdb
  username: 'pmm',
  password: 'pmmpass',
};
const mongodb_service_name = 'mongodb_test_collections_flag';
const containerName = 'rs101';

const pmm_user_mongodb = {
  username: 'pmm',
  password: 'pmmpass',
};

const metrics = {
  collstats: 'mongodb_collstats_latencyStats_commands_latency',
  dbstats: 'mongodb_dbstats_collections',
  diagnosticdata: 'mongodb_ss_metrics_commands_getDiagnosticData_total',
  indexstats: 'mongodb_indexstats_accesses_ops',
  topmetrics: 'mongodb_top_total_count',
};

BeforeSuite(async ({ I }) => {
  await I.mongoConnect(connection);
  for (let i = 0; i < dbNames.length; i++) {
    await I.mongoCreateBulkCollections(dbNames[i], collectionNames);
  }

  // check that rs101 docker container exists
  const dockerCheck = await I.verifyCommand('docker ps | grep rs101');

  assert.ok(dockerCheck.includes('rs101'), 'rs101 docker container should exist. please run pmm-framework with --database psmdb');
});

Before(async ({ I }) => {
  await I.Authorize();
});

After(async ({ I }) => {
  await I.verifyCommand(`docker exec ${containerName} pmm-admin remove mongodb ${mongodb_service_name} || true`);
});

AfterSuite(async ({ I }) => {
  await I.mongoDisconnect();
});

Scenario(
  'PMM-T1860 - Verify there is no CommandNotSupportedOnView error in mongo logs when using --enable-all-collectors @dashboards @mongodb-exporter',
  async ({ I }) => {
    const logs = await I.verifyCommand(`docker exec ${containerName} journalctl -u mongod --since "5 minutes ago"`);

    assert.ok(!logs.includes('CommandNotSupportedOnView'), `"CommandNotSupportedOnView" error should not be in mongo logs. 
 ${logs}`);
  },
);

Scenario(
  'PMM-T1208 - Verify metrics of MongoDB added with default flags'
  + ' @not-ui-pipeline @mongodb-exporter @exporters',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    await I.say(await I.verifyCommand(`docker exec ${containerName} pmm-admin add mongodb --agent-password='testing' --password=${pmm_user_mongodb.password} --username=${pmm_user_mongodb.username} --service-name=${mongodb_service_name} --replication-set=rs0s`));

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongodb_service_name);
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
  'PMM-T1209 - Verify metrics of MongoDB with --disable-collectors=topmetrics and --enable-all-collectors were specified'
  + ' @not-ui-pipeline @mongodb-exporter @exporters',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    await I.say(await I.verifyCommand(`docker exec ${containerName} pmm-admin add mongodb --agent-password='testing' --password=${pmm_user_mongodb.password} --username=${pmm_user_mongodb.username} --enable-all-collectors  --disable-collectors=topmetrics --service-name=${mongodb_service_name} --replication-set=rs0s`));

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
  'PMM-T1210 - Verify metrics of MongoDB with "--enable-all-collectors" was specified'
  + ' @not-ui-pipeline @mongodb-exporter @exporters',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    await I.say(await I.verifyCommand(`docker exec ${containerName} pmm-admin add mongodb --agent-password='testing' --password=${pmm_user_mongodb.password} --username=${pmm_user_mongodb.username} --enable-all-collectors --service-name=${mongodb_service_name} --replication-set=rs0s`));

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongodb_service_name);
    const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);

    // assert dbstats and topmetrics collectors are enabled
    I.assertTrue(Object.hasOwn(agentInfo, 'enable_all_collectors'), `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "enable_all_collectors" property`);
    I.assertTrue(agentInfo.enable_all_collectors, `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "enable_all_collectors" property with "true"`);
    await I.say('Wait 60 seconds for Metrics being collected for the new service');
    await I.wait(60);
    await grafanaAPI.checkMetricExist(metrics.dbstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricExist(metrics.collstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricExist(metrics.indexstats, { type: 'service_name', value: mongodb_service_name });
    await grafanaAPI.checkMetricExist(metrics.topmetrics, { type: 'service_name', value: mongodb_service_name });
  },
);

Scenario(
  'PMM-T1211 - Verify metrics of MongoDB with --disable-collectors="" and --enable-all-collectors were specified'
  + ' @not-ui-pipeline @mongodb-exporter @exporters',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    await I.say(await I.verifyCommand(`docker exec ${containerName} pmm-admin add mongodb --agent-password='testing' --password=${pmm_user_mongodb.password} --username=${pmm_user_mongodb.username} --enable-all-collectors  --disable-collectors="" --service-name=${mongodb_service_name} --replication-set=rs0s`));

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
  'PMM-T1212 - Verify metrics of MongoDB with --disable-collectors="collstats,dbstats,topmetrics" specified'
  + ' @not-ui-pipeline @mongodb-exporter @exporters',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    await I.say(await I.verifyCommand(`docker exec ${containerName} pmm-admin add mongodb --agent-password='testing' --password=${pmm_user_mongodb.password} --username=${pmm_user_mongodb.username} --enable-all-collectors  --disable-collectors="collstats,dbstats,topmetrics" --service-name=${mongodb_service_name} --replication-set=rs0s`));

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
  'PMM-T1213 - Verify metrics of MongoDB with --stats-collections=db1,db2.col2 specified'
  + ' @not-ui-pipeline @mongodb-exporter @exporters',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    await I.say(await I.verifyCommand(`docker exec ${containerName} pmm-admin add mongodb --agent-password='testing' --password=${pmm_user_mongodb.password} --username=${pmm_user_mongodb.username} --enable-all-collectors --stats-collections=db1,db2.col2 --service-name=${mongodb_service_name} --replication-set=rs0s`));

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
    await grafanaAPI.checkMetricExist(metrics.collstats, [{ type: 'service_name', value: mongodb_service_name }, { type: 'database', value: 'db1' }]);
    await grafanaAPI.checkMetricAbsent(metrics.collstats, [{ type: 'service_name', value: mongodb_service_name }, { type: 'database', value: 'db3' }, { type: 'collection', value: 'col3' }]);
    await grafanaAPI.checkMetricAbsent(metrics.collstats, [{ type: 'service_name', value: mongodb_service_name }, { type: 'database', value: 'db2' }, { type: 'collection', value: 'col1' }]);
    await grafanaAPI.checkMetricExist(metrics.collstats, [{ type: 'service_name', value: mongodb_service_name }, { type: 'database', value: 'db2' }, { type: 'collection', value: 'col2' }]);
  },
);

Scenario(
  'PMM-T1213 - Verify metrics of MongoDB with --stats-collections=db1,db2.col2 & --max-collections-limit=5 specified when total collections across db1, db2 and the filters are 6'
  + ' @not-ui-pipeline @mongodb-exporter @exporters',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    await I.say(await I.verifyCommand(`docker exec ${containerName} pmm-admin add mongodb --agent-password='testing' --password=${pmm_user_mongodb.password} --username=${pmm_user_mongodb.username} --enable-all-collectors --max-collections-limit=5 --stats-collections=db1,db2.col2 --service-name=${mongodb_service_name} --replication-set=rs0s`));

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
    await grafanaAPI.checkMetricAbsent(metrics.collstats, [{ type: 'service_name', value: mongodb_service_name }, { type: 'database', value: 'db1' }]);
    await grafanaAPI.checkMetricAbsent(metrics.collstats, [{ type: 'service_name', value: mongodb_service_name }, { type: 'database', value: 'db3' }, { type: 'collection', value: 'col3' }]);
    await grafanaAPI.checkMetricAbsent(metrics.collstats, [{ type: 'service_name', value: mongodb_service_name }, { type: 'database', value: 'db2' }, { type: 'collection', value: 'col1' }]);
    await grafanaAPI.checkMetricAbsent(metrics.collstats, [{ type: 'service_name', value: mongodb_service_name }, { type: 'database', value: 'db2' }, { type: 'collection', value: 'col2' }]);
  },
);

Scenario(
  'PMM-T1213 - Verify metrics of MongoDB with --stats-collections=db1,db2.col2 & --max-collections-limit=400 specified to allow fetching metrics from all collectors'
  + ' @not-ui-pipeline @mongodb-exporter @exporters',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    await I.say(await I.verifyCommand(`docker exec ${containerName} pmm-admin add mongodb --agent-password='testing' --password=${pmm_user_mongodb.password} --username=${pmm_user_mongodb.username} --enable-all-collectors --max-collections-limit=400 --stats-collections=db1,db2.col2 --service-name=${mongodb_service_name} --replication-set=rs0s`));

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
    await grafanaAPI.checkMetricExist(metrics.collstats, [{ type: 'service_name', value: mongodb_service_name }, { type: 'database', value: 'db1' }]);
    await grafanaAPI.checkMetricAbsent(metrics.collstats, [{ type: 'service_name', value: mongodb_service_name }, { type: 'database', value: 'db3' }, { type: 'collection', value: 'col3' }]);
    await grafanaAPI.checkMetricAbsent(metrics.collstats, [{ type: 'service_name', value: mongodb_service_name }, { type: 'database', value: 'db2' }, { type: 'collection', value: 'col1' }]);
    await grafanaAPI.checkMetricExist(metrics.collstats, [{ type: 'service_name', value: mongodb_service_name }, { type: 'database', value: 'db2' }, { type: 'collection', value: 'col2' }]);
  },
);

Scenario(
  'PMM-9919 Verify smart metrics of MongoDB with --stats-collections=db1,db2.col2 & --max-collections-limit=400 specified to allow fetching metrics from all collectors'
  + ' @not-ui-pipeline @mongodb-exporter @exporters',
  async ({ I, inventoryAPI, grafanaAPI }) => {
    await I.say(await I.verifyCommand(`docker exec ${containerName} pmm-admin add mongodb --agent-password='testing' --password=${pmm_user_mongodb.password} --username=${pmm_user_mongodb.username} --enable-all-collectors --max-collections-limit=400 --stats-collections=db1,db2.col2 --service-name=${mongodb_service_name} --replication-set=rs0s`));

    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongodb_service_name);
    const agentInfo = await inventoryAPI.apiGetPMMAgentInfoByServiceId(service_id);
    const smartMetricName = 'collector_scrape_time_ms';

    // assert dbstats and topmetrics collectors are enabled
    // eslint-disable-next-line no-prototype-builtins
    assert.ok(agentInfo.hasOwnProperty('enable_all_collectors'), `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "enable_all_collectors" property`);
    // eslint-disable-next-line no-prototype-builtins
    assert.ok(agentInfo.enable_all_collectors, `Was expecting Mongo Exporter for service ${mongodb_service_name} to have "enable_all_collectors" property with "true"`);
    I.say('Wait 20 seconds for Metrics being collected for the new service');
    await I.wait(20);
    await grafanaAPI.checkMetricExist(smartMetricName, [{ type: 'service_name', value: mongodb_service_name }, { type: 'collector', value: 'collstats' }]);
    await grafanaAPI.checkMetricExist(smartMetricName, [{ type: 'service_name', value: mongodb_service_name }, { type: 'collector', value: 'dbstats' }]);
    await grafanaAPI.checkMetricExist(smartMetricName, [{ type: 'service_name', value: mongodb_service_name }, { type: 'collector', value: 'diagnostic_data' }]);
    await grafanaAPI.checkMetricExist(smartMetricName, [{ type: 'service_name', value: mongodb_service_name }, { type: 'collector', value: 'general' }]);
    await grafanaAPI.checkMetricExist(smartMetricName, [{ type: 'service_name', value: mongodb_service_name }, { type: 'collector', value: 'indexstats' }]);
    await grafanaAPI.checkMetricExist(smartMetricName, [{ type: 'service_name', value: mongodb_service_name }, { type: 'collector', value: 'replset_status' }]);
    await grafanaAPI.checkMetricExist(smartMetricName, [{ type: 'service_name', value: mongodb_service_name }, { type: 'collector', value: 'top' }]);
    await I.say(await I.verifyCommand(`docker exec ${containerName} pmm-admin remove mongodb ${mongodb_service_name}`));

    // Re-add Service with Disable Top metrics, check no smart metrics for Top
    await I.say(await I.verifyCommand(`docker exec ${containerName} pmm-admin add mongodb --agent-password='testing' --password=${pmm_user_mongodb.password} --username=${pmm_user_mongodb.username} --enable-all-collectors --disable-collectors=topmetrics --max-collections-limit=400 --stats-collections=db1,db2.col2 --service-name=${mongodb_service_name} --replication-set=rs0s`));
    await I.wait(30);
    await grafanaAPI.checkMetricExist(smartMetricName, [{ type: 'service_name', value: `${mongodb_service_name}` }, { type: 'collector', value: 'dbstats' }]);
    await grafanaAPI.checkMetricAbsent(smartMetricName, [{ type: 'service_name', value: `${mongodb_service_name}` }, { type: 'collector', value: 'top' }]);
  },
);

Scenario(
  'PMM-T1280 Verify that pmm-admin inventory add agent mongodb-exporter with --log-level flag adds MongoDB exporter with corresponding log-level'
  + 'PMM-T1282, PMM-T1284, PMM-T1291 Verify that pmm-admin inventory add agent node-exporter with --log-level flag adds Node exporter with corresponding log-level @not-ui-pipeline @mongodb-exporter @exporters',
  async ({
    I, inventoryAPI, dashboardPage,
  }) => {
    I.amOnPage(dashboardPage.mongoDbInstanceOverview.url);
    dashboardPage.waitForDashboardOpened();
    // adding service which will be used to verify various inventory addition commands
    await I.say(await I.verifyCommand(`docker exec ${containerName} pmm-admin add mongodb --agent-password='testing' --password=${pmm_user_mongodb.password} --username=${pmm_user_mongodb.username} --enable-all-collectors --service-name=${mongodb_service_name}`));
    //
    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', mongodb_service_name);
    const pmm_agent_id = (await I.verifyCommand(`docker exec ${containerName} pmm-admin status | grep "Agent ID" | awk -F " " '{print $4}'`)).trim();

    const dbDetails = {
      username: pmm_user_mongodb.username,
      password: pmm_user_mongodb.password,
      pmm_agent_id,
      service_id,
      service_name: mongodb_service_name,
      container_name: containerName,
    };

    await inventoryAPI.verifyAgentLogLevel('mongodb', dbDetails);
    await inventoryAPI.verifyAgentLogLevel('mongodb_profiler', dbDetails);
    await inventoryAPI.verifyAgentLogLevel('node', dbDetails);
    await inventoryAPI.verifyAgentLogLevel('mongodb', dbDetails, 'debug');
    await inventoryAPI.verifyAgentLogLevel('mongodb_profiler', dbDetails, 'debug');
    await inventoryAPI.verifyAgentLogLevel('node', dbDetails, 'debug');
    await inventoryAPI.verifyAgentLogLevel('mongodb', dbDetails, 'info');
    await inventoryAPI.verifyAgentLogLevel('mongodb_profiler', dbDetails, 'debug');
    await inventoryAPI.verifyAgentLogLevel('node', dbDetails, 'info');
    await inventoryAPI.verifyAgentLogLevel('mongodb', dbDetails, 'warn');
    await inventoryAPI.verifyAgentLogLevel('mongodb_profiler', dbDetails, 'warn');
    await inventoryAPI.verifyAgentLogLevel('node', dbDetails, 'warn');
    await inventoryAPI.verifyAgentLogLevel('mongodb', dbDetails, 'error');
    await inventoryAPI.verifyAgentLogLevel('mongodb_profiler', dbDetails, 'error');
    await inventoryAPI.verifyAgentLogLevel('node', dbDetails, 'error');
    await inventoryAPI.verifyAgentLogLevel('mongodb', dbDetails, 'fatal');
    await inventoryAPI.verifyAgentLogLevel('mongodb_profiler', dbDetails, 'fatal');
  },
);

Scenario(
  'PMM-T1352 + PMM-T610 Verify that pmm-admin inventory remove service with --force flag stops running agents and collecting data from exporters'
  + ' @not-ui-pipeline @mongodb-exporter @exporters',
  async ({
    I, inventoryAPI, grafanaAPI, dashboardPage,
  }) => {
    I.amOnPage(dashboardPage.mongoDbInstanceOverview.url);
    dashboardPage.waitForDashboardOpened();
    const service_name = 'testing_force_flag';

    // adding service which will be used to verify various inventory addition commands
    await I.say(await I.verifyCommand(`docker exec ${containerName} pmm-admin add mongodb --agent-password='testing' --password=${pmm_user_mongodb.password} --username=${pmm_user_mongodb.username} --enable-all-collectors --service-name=${mongodb_service_name}`));
    const pmm_agent_id = (await I.verifyCommand(`docker exec ${containerName} pmm-admin status | grep "Agent ID" | awk -F " " '{print $4}'`)).trim();

    // adding service which will be used to verify various inventory addition commands
    await I.say(await I.verifyCommand(`docker exec ${containerName} pmm-admin add mongodb --agent-password='testing' --password=${pmm_user_mongodb.password} --username=${pmm_user_mongodb.username} --enable-all-collectors --service-name=${service_name}`));
    const { service_id } = await inventoryAPI.apiGetNodeInfoByServiceName('MONGODB_SERVICE', service_name);

    await grafanaAPI.waitForMetric('mongodb_up', [{ type: 'service_name', value: service_name }], 90);
    await I.verifyCommand(`docker exec ${containerName} pmm-admin inventory remove service ${service_id} --force`);
    await grafanaAPI.waitForMetricAbsent('mongodb_up', [{ type: 'service_name', value: service_name }], 90);
    // PMM-T1352 Verify that Node exporter cannot be added by pmm-admin inventory add agent node-exporter with --log-level=fatal
    await I.verifyCommand(`docker exec ${containerName} pmm-admin inventory add agent node-exporter --log-level=fatal ${pmm_agent_id}`, 'pmm-admin: error: --log-level must be one of "debug","info","warn","error" but got "fatal"', 'fail');
  },
);
