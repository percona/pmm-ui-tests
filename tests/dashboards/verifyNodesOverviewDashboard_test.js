
Feature('Tests for Operation System Dashboards');
const dockerVersion = process.env.CLIENT_VERSION || 'perconalab/pmm-client:dev-latest';
let pmmVersion;

BeforeSuite(async ({ homePage }) => {
  pmmVersion = await homePage.getVersions().versionMinor;
});


Before(async ({ I }) => {
  await I.Authorize();
});


Scenario(
  'PMM-T1642 - Verify that filtering by Environment works OS dashboards @docker-configuration',
  async ({
    I, nodesOverviewPage,
  }) => {
    if (pmmVersion > 36) {
      await I.verifyCommand(`docker run \
        --rm \
        --name pmm-client \
        --add-host host.docker.internal:host-gateway \
        --env PMM_AGENT_SERVER_ADDRESS=127.0.0.1 \
        --env PMM_AGENT_SERVER_USERNAME=admin \
        --env PMM_AGENT_SERVER_PASSWORD=admin \
        --env PMM_AGENT_SERVER_INSECURE_TLS=1 \
        --env PMM_AGENT_SETUP=1 \
        --env PMM_AGENT_CONFIG_FILE=config/pmm-agent.yaml \
        --env PMM_AGENT_SETUP_CUSTOM_LABELS="environment=dev" \
        --env PMM_AGENT_SETUP_REGION=EU \
        --volumes-from pmm-client-data \
        ${dockerVersion}`);
      await I.amOnPage('');
      await nodesOverviewPage.selectEnvironment('dev');

      const envName = await I.grabTextFromAll(nodesOverviewPage.buttons.environment);

      await I.assertEqual(envName, 'prod', `The value of selected environment "${envName}" does not equal expected one "dev"}`);
    } else {
      I.say('This functionality was added in PMM 2.36.0')
    }
  });