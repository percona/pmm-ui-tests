Feature('Tests for Operation System Dashboards');

const dockerVersion = process.env.CLIENT_VERSION ? `perconalab/pmm-client:${process.env.CLIENT_VERSION}` : 'perconalab/pmm-client:dev-latest';
let pmmVersion;

BeforeSuite(async ({ homePage }) => {
  pmmVersion = await homePage.getVersions().versionMinor;
});

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  '@PMM-T1642 - Verify that filtering by Environment works OS dashboards @docker-configuration',
  async ({
    I, nodesOverviewPage, dashboardPage, inventoryAPI,
  }) => {
    await I.amOnPage(nodesOverviewPage.url);
    console.log(`PMM Server Version is: ${pmmVersion}`);
    if (pmmVersion >= 36 || pmmVersion === undefined) {
      const networks = await I.verifyCommand('docker inspect pmm-server');

      console.log(networks);
      const output = await I.verifyCommand(`docker run -d \
        --name pmm-T1642-client \
        --network="pmm2-ui-tests_pmm-network"
        --add-host host.docker.internal:host-gateway \
        --env PMM_AGENT_SERVER_ADDRESS=pmm-server \
        --env PMM_AGENT_SERVER_USERNAME=admin \
        --env PMM_AGENT_SERVER_PASSWORD=admin \
        --env PMM_AGENT_SERVER_INSECURE_TLS=1 \
        --env PMM_AGENT_SETUP=1 \
        --env PMM_AGENT_CONFIG_FILE=config/pmm-agent.yaml \
        --env PMM_AGENT_SETUP_CUSTOM_LABELS="environment=dev" \
        --env PMM_AGENT_SETUP_REGION=EU \
        ${dockerVersion}`);

      console.log(output);

      await I.wait(60);
      const containers = await I.verifyCommand('sudo docker ps -a');

      console.log(await inventoryAPI.listNodes());
      console.log(containers);
      await I.click(nodesOverviewPage.buttons.refreshDashboard);
      await nodesOverviewPage.selectEnvironment('dev');
      const envName = await I.grabTextFromAll(nodesOverviewPage.buttons.environment);

      console.log(`Env Name is: ${envName}`);
      await I.assertContain(envName, 'dev', `The value of selected environment "${envName}" does not equal expected one "dev"}`);
      await dashboardPage.waitForGraphsToHaveData(1, 300);
    } else {
      console.log('This functionality was added in PMM 2.36.0');
      I.say('This functionality was added in PMM 2.36.0');
    }
  },
);
