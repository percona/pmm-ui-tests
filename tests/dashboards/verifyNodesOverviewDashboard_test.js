Feature('Tests for Operation System Dashboards');

const dockerVersion = process.env.CLIENT_VERSION ? `perconalab/pmm-client:${process.env.CLIENT_VERSION}` : 'perconalab/pmm-client:dev-latest';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
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
    if (pmmVersion >= 36 || pmmVersion === undefined) {
      await I.verifyCommand(`docker run -d \
        --name pmm-T1642-client \
        --network="pmm2-ui-tests_pmm-network"
        --add-host host.docker.internal:host-gateway \
        --env PMM_AGENT_SERVER_ADDRESS=pmm-server \
        --env PMM_AGENT_SERVER_USERNAME=admin \
        --env PMM_AGENT_SERVER_PASSWORD=${adminPassword} \
        --env PMM_AGENT_SERVER_INSECURE_TLS=1 \
        --env PMM_AGENT_SETUP=1 \
        --env PMM_AGENT_CONFIG_FILE=config/pmm-agent.yaml \
        --env PMM_AGENT_SETUP_CUSTOM_LABELS="environment=dev" \
        --env PMM_AGENT_SETUP_REGION=EU \
        ${dockerVersion}`);

      await I.waitForVisible(nodesOverviewPage.buttons.refreshDashboard, 60);
      await I.click(nodesOverviewPage.buttons.refreshDashboard);
      await nodesOverviewPage.selectEnvironment('dev');
      const envName = await I.grabTextFromAll(nodesOverviewPage.buttons.environment);

      await I.assertContain(envName, 'dev', `The value of selected environment "${envName}" does not equal expected one "dev"}`);
      await dashboardPage.waitForGraphsToHaveData(3, 300);
    } else {
      I.say('This functionality was added in PMM 2.36.0');
    }
  },
);
