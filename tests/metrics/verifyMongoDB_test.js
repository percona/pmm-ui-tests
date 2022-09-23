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

BeforeSuite(async ({ I }) => {
  const detectedPort = await I.verifyCommand('pmm-admin list | grep mongodb_node_1 | awk -F " " \'{print $3}\' | awk -F ":" \'{print $2}\'');

  connection.port = detectedPort;
  await I.mongoConnect(connection);
  await I.mongoAddUser(mongo_test_user.username, mongo_test_user.password);
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
