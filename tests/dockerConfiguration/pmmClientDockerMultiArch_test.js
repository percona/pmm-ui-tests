Feature('Test PMM client multi arch docker container').retry(1);

BeforeSuite(async ({ I }) => {
  const pmmClientDockerTag = process.env.CLIENT_VERSION || 'perconalab/pmm-client-test:dev-latest';
  const pmmServerAdminPassword = process.env.ADMIN_PASSWORD || 'admin';
  const networkName = 'pmm2-ui-tests_pmm-network';
  const pmmServerAddress = process.env.ARCHITECTURE === 'agent-amd64' ? 'pmm-server' : process.env.SERVER_IP;

  await I.verifyCommand(`docker network create ${networkName} || true`);
  await I.verifyCommand(`docker run -d 
          --name pmm-client-${process.env.ARCHITECTURE}
          -e PMM_AGENT_SERVER_ADDRESS=${pmmServerAddress}
          -e PMM_AGENT_SERVER_USERNAME=admin 
          -e PMM_AGENT_SERVER_PASSWORD=${pmmServerAdminPassword}
          -e PMM_AGENT_SERVER_INSECURE_TLS=1 
          -e PMM_AGENT_PORTS_MIN=41000
          -e PMM_AGENT_PORTS_MAX=41500
          -e PMM_AGENT_SETUP=1 
          -e PMM_AGENT_CONFIG_FILE=config/pmm-agent.yaml 
          -e PMM_AGENT_SETUP_NODE_NAME=pmm-client-${process.env.ARCHITECTURE}
          -e PMM_AGENT_SETUP_FORCE=1
          -e PMM_AGENT_SETUP_NODE_TYPE=container
          --network ${networkName} 
          ${pmmClientDockerTag}`);

  I.wait(10);

  await I.verifyCommand(`docker exec pmm-client-${process.env.ARCHITECTURE} pmm-agent setup --force --config-file=/usr/local/percona/pmm2/config/pmm-agent.yaml --server-address=${pmmServerAddress}:443 --server-insecure-tls --server-username=admin --server-password=${pmmServerAdminPassword}`);

  await I.verifyCommand(`docker run -d 
           --name mysql-multiarch 
           --network ${networkName}  
           -e MYSQL_ROOT_PASSWORD=testPassword 
           mysql:8`);

  I.wait(15);

  await I.verifyCommand(`docker exec pmm-client-${process.env.ARCHITECTURE} pmm-admin add mysql --query-source=perfschema --username=root --password=testPassword --host=mysql-multiarch --port=3306`);
});

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario('PMM-T1923 Verify sanity check on pmm-client docker multi arch image (amd64, arm64) @docker-client-multi-arch', async ({ I, dashboardPage, adminPage }) => {
  const url = I.buildUrlWithParams(dashboardPage.mysqlInstanceSummaryDashboard.clearUrl, { from: 'now-5m' });

  I.amOnPage(url);
  dashboardPage.waitForDashboardOpened();
  await dashboardPage.expandEachDashboardRow();
  await dashboardPage.verifyThereAreNoGraphsWithNA(4);
  await dashboardPage.verifyThereAreNoGraphsWithoutData(5);
});
