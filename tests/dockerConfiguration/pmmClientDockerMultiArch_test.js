Feature('Test PMM client multi arch docker container').retry(1);

BeforeSuite(async ({ I }) => {
  // eslint-disable-next-line no-inline-comments
  const DOCKER_IMAGE = /* process.env.CLIENT_VERSION || */ 'perconalab/pmm-client-test:dev-latest';
  const SERVER_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
  const networkName = 'pmm-ui-tests-network';

  await I.verifyCommand(`docker network create ${networkName}`);
  await I.verifyCommand(`docker network connect ${networkName} pmm-server`);
  I.wait(30);

  await I.verifyCommand(`docker run -d 
          --name pmm-client 
          -e PMM_AGENT_SERVER_ADDRESS=pmm-server
          -e PMM_AGENT_SERVER_USERNAME=admin 
          -e PMM_AGENT_SERVER_PASSWORD=${SERVER_PASSWORD}
          -e PMM_AGENT_SERVER_INSECURE_TLS=1 
          -e PMM_AGENT_PORTS_MIN=41000
          -e PMM_AGENT_PORTS_MAX=41500
          -e PMM_AGENT_SETUP=1 
          -e PMM_AGENT_CONFIG_FILE=config/pmm-agent.yaml 
          -e PMM_AGENT_SETUP_NODE_NAME=pmm-client
          -e PMM_AGENT_SETUP_FORCE=1
          -e PMM_AGENT_SETUP_NODE_TYPE=container
          --network ${networkName} 
          ${DOCKER_IMAGE}`);
  I.wait(10);
  await I.verifyCommand(`docker exec pmm-client pmm-agent --force --server-insecure-tls --server-url=https://admin:${SERVER_PASSWORD}@pmm-server:443 --config-file=/usr/local/percona/pmm2/config/pmm-agent.yaml`, null, 'fail', true);

  console.log(await I.verifyCommand('docker ps -a'));

  await I.verifyCommand(`docker run -d 
           --name mysql-multiarch 
           --network ${networkName}  
           -e MYSQL_ROOT_PASSWORD=testPassword 
           mysql:8`);
  I.wait(30);
  await I.verifyCommand('docker exec pmm-client pmm-admin add mysql --query-source=perfschema --username=root --password=testPassword --host=mysql-multiarch --port=3306');
  I.wait(10);
  console.log(await I.verifyCommand('docker exec pmm-client pmm-admin list'));
});

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario('Verify that dashboards contain data @client-docker-multi-arch', async ({ I, dashboardPage, adminPage }) => {
  const url = I.buildUrlWithParams(dashboardPage.mysqlInstanceSummaryDashboard.clearUrl, { from: 'now-5m' });

  I.amOnPage(url);
  dashboardPage.waitForDashboardOpened();
  adminPage.performPageDown(5);
  await dashboardPage.expandEachDashboardRow();
  adminPage.performPageUp(5);
  await dashboardPage.verifyThereAreNoGraphsWithNA(1);
  await dashboardPage.verifyThereAreNoGraphsWithoutData(5);
  await dashboardPage.verifyThereAreNoGraphsWithNA();
  await dashboardPage.verifyThereAreNoGraphsWithoutData();
  I.saveScreenshot();
});
