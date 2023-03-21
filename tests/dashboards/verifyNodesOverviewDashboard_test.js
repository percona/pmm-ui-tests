Feature('Tests for Operation System Dashboards');

const dockerVersion = process.env.DOCKER_VERSION || 'perconalab/pmm-client:dev-latest';
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
    I, nodesOverviewPage, dashboardPage,
  }) => {
    await I.amOnPage(nodesOverviewPage.url);
    console.log(`PMM Server Version is: ${pmmVersion}`);
    if (pmmVersion >= 36 || pmmVersion === undefined) {
      const output = await I.verifyCommand(`docker run \
        -d --rm \
        --name pmm-T1642-client \
        --add-host host.docker.internal:host-gateway \
        --env PMM_AGENT_SERVER_ADDRESS=127.0.0.1 \
        --env PMM_AGENT_SERVER_USERNAME=admin \
        --env PMM_AGENT_SERVER_PASSWORD=admin \
        --env PMM_AGENT_SERVER_INSECURE_TLS=1 \
        --env PMM_AGENT_SETUP=1 \
        --env PMM_AGENT_CONFIG_FILE=config/pmm-agent.yaml \
        --env PMM_AGENT_SETUP_CUSTOM_LABELS="environment=dev" \
        --env PMM_AGENT_SETUP_REGION=EU \
        ${dockerVersion}`);

      console.log(output);

      await I.wait(300);
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
