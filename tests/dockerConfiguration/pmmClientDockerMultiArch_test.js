Feature('Test PMM client multi arch docker container').retry(1);

BeforeSuite(async ({ I }) => {
  // eslint-disable-next-line no-inline-comments
  const DOCKER_IMAGE = /* process.env.CLIENT_VERSION || */ 'perconalab/pmm-client-test:dev-latest';
  const SERVER_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
  const networkName = 'pmm-ui-tests-network';
  const pmmServerAddress = process.env.ARCHITECTURE === 'agent-amd64' ? 'pmm-server' : process.env.SERVER_IP;

  console.log(`Ip address is: ${process.env.SERVER_IP}`);
  console.log(`Architecture is: ${process.env.ARCHITECTURE}`);
  console.log(await I.verifyCommand('docker network ls --format "{{ .Name }}'));
  await I.verifyCommand(`docker network create ${networkName}`);
  await I.verifyCommand(`docker run -d 
          --name pmm-client 
          -e PMM_AGENT_SERVER_ADDRESS=${pmmServerAddress}
          -e PMM_AGENT_SERVER_USERNAME=admin 
          -e PMM_AGENT_SERVER_PASSWORD=${SERVER_PASSWORD}
          -e PMM_AGENT_SERVER_INSECURE_TLS=1 
          -e PMM_AGENT_PORTS_MIN=41000
          -e PMM_AGENT_PORTS_MAX=41500
          -e PMM_AGENT_SETUP=1 
          -e PMM_AGENT_CONFIG_FILE=config/pmm-agent.yaml 
          -e PMM_AGENT_SETUP_NODE_NAME=pmm-client-${process.env.ARCHITECTURE}
          -e PMM_AGENT_SETUP_FORCE=1
          -e PMM_AGENT_SETUP_NODE_TYPE=container
          --network ${networkName} 
          ${DOCKER_IMAGE}`);

  I.wait(10);
  console.log(await I.verifyCommand('docker logs pmm-client'));
  await I.verifyCommand(`docker exec pmm-client-${process.env.ARCHITECTURE} pmm-agent --force --server-insecure-tls --server-url=https://admin:${SERVER_PASSWORD}@pmm-server:443 --config-file=/usr/local/percona/pmm2/config/pmm-agent.yaml`, null, 'fail', true);
  await I.verifyCommand(`docker run -d 
           --name mysql-multiarch 
           --network ${networkName}  
           -e MYSQL_ROOT_PASSWORD=testPassword 
           mysql:8`);

  I.wait(15);
  console.log(await I.verifyCommand('docker logs pmm-client'));
  await I.verifyCommand('docker exec pmm-client pmm-admin add mysql --query-source=perfschema --username=root --password=testPassword --host=mysql-multiarch --port=3306');
});

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario('Verify that dashboards contain data @client-docker-multi-arch', async ({ I, dashboardPage, adminPage }) => {
  const url = I.buildUrlWithParams(dashboardPage.mysqlInstanceSummaryDashboard.clearUrl, { from: 'now-5m' });

  I.amOnPage(url);
  dashboardPage.waitForDashboardOpened();
  await dashboardPage.expandEachDashboardRow();
  await dashboardPage.verifyThereAreNoGraphsWithNA(4);
  await dashboardPage.verifyThereAreNoGraphsWithoutData(5);
});
