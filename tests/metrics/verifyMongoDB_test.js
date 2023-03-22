Feature('MongoDB Metrics tests');

const connection = {
  host: '127.0.0.1',
  // eslint-disable-next-line no-inline-comments
  port: '27023', // This is the port used by --addclient=modb,1 and docker-compose setup on a CI/CD
  username: 'mongoadmin',
  password: 'GRgrO9301RuF',
};
const mongodb_service_name = 'mongodb_test_pass_plus';
const mongo_test_user = {
  username: 'test_user',
  password: 'pass+',
};

const telemetry = {
  collstats: 'mongodb_collector_scrape_time_collstats',
  dbstats: 'mongodb_collector_scrape_time_dbstats',
  diagnosticData: 'mongodb_collector_scrape_time_diagnostic_data',
  general: 'mongodb_collector_scrape_time_general',
  indexstats: 'mongodb_collector_scrape_time_indexstats',
  top: 'mongodb_collector_scrape_time_top',
  replsetStatus: 'mongodb_collector_scrape_time_replset_status',
};

BeforeSuite(async ({ I }) => {
  const detectedPort = await I.verifyCommand('pmm-admin list | grep mongodb_node_1 | awk -F " " \'{print $3}\' | awk -F ":" \'{print $2}\'');

  connection.port = detectedPort;
  // await I.mongoConnect(connection);
  // await I.mongoAddUser(mongo_test_user.username, mongo_test_user.password);
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
  'PMM-T1241 - Verify add mongoDB service with "+" in user password @not-ui-pipeline @mongodb-exporter @exporters',
  async ({ I, grafanaAPI }) => {
    await I.say(
      await I.verifyCommand(`pmm-admin add mongodb --port=${connection.port} --password=${mongo_test_user.password} --username='${mongo_test_user.username}' --service-name=${mongodb_service_name}`),
    );

    await grafanaAPI.waitForMetric('mongodb_up', { type: 'service_name', value: mongodb_service_name }, 65);
  },
);

Scenario(
  'PMM-T1458 - Verify MongoDB exporter meta-metrics supporting @not-ui-pipeline @mongodb-exporter @exporters',
  async ({ I }) => {
    await I.say(await I.verifyCommand(`pmm-admin add mongodb --port=${connection.port} --password=${connection.password} --username=${connection.username} --service-name=${mongodb_service_name} --enable-all-collectors`));
    let logs = '';

    await I.asyncWaitFor(async () => {
      logs = await I.verifyCommand('docker exec pmm-server cat /srv/logs/pmm-managed.log | grep mongodb_collector_scrape_time');
      // const logs = await I.verifyCommand('docker exec pmm-server tail -n 100 /srv/logs/pmm-agent.log');
      console.log(logs);
      await I.say(logs);

      return logs.includes(telemetry.collstats)
        && logs.includes(telemetry.dbstats)
        && logs.includes(telemetry.diagnosticData)
        && logs.includes(telemetry.general)
        && logs.includes(telemetry.indexstats)
        && logs.includes(telemetry.top)
        && logs.includes(telemetry.replsetStatus);
      // return logs.length > 1;
    }, 60);
    I.assertTrue(logs.includes(telemetry.collstats), `/srv/logs/pmm-managed.log expected to contain '${telemetry.collstats}'`);
    I.assertTrue(logs.includes(telemetry.dbstats), `/srv/logs/pmm-managed.log expected to contain '${telemetry.dbstats}'`);
    I.assertTrue(logs.includes(telemetry.diagnosticData), `/srv/logs/pmm-managed.log expected to contain '${telemetry.diagnosticData}'`);
    I.assertTrue(logs.includes(telemetry.general), `/srv/logs/pmm-managed.log expected to contain '${telemetry.general}'`);
    I.assertTrue(logs.includes(telemetry.indexstats), `/srv/logs/pmm-managed.log expected to contain '${telemetry.indexstats}'`);
    I.assertTrue(logs.includes(telemetry.top), `/srv/logs/pmm-managed.log expected to contain '${telemetry.top}'`);
    I.assertTrue(logs.includes(telemetry.replsetStatus), `/srv/logs/pmm-managed.log expected to contain '${telemetry.replsetStatus}'`);
  },
);
