Feature('Tests for Operation System Dashboards');

const dockerVersion = 'perconalab/pmm-client:3-dev-latest';
const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario(
  'PMM-T1642 - Verify that filtering by Environment works OS dashboards @docker-configuration',
  async ({ I, dashboardPage }) => {
    const expectedEnvName = 'dev';

    await I.verifyCommand(`docker run -d \
        --name pmm-T1642-client \
        --network="pmm-qa"
        --add-host host.docker.internal:host-gateway \
        --env PMM_AGENT_SERVER_ADDRESS=pmm-server \
        --env PMM_AGENT_SERVER_USERNAME=admin \
        --env PMM_AGENT_SERVER_PASSWORD=${adminPassword} \
        --env PMM_AGENT_SERVER_INSECURE_TLS=1 \
        --env PMM_AGENT_SETUP=1 \
        --env PMM_AGENT_CONFIG_FILE=config/pmm-agent.yaml \
        --env PMM_AGENT_SETUP_CUSTOM_LABELS="environment=${expectedEnvName}" \
        --env PMM_AGENT_SETUP_REGION=EU \
        ${dockerVersion}`);

    await I.wait(45);
    await I.amOnPage(I.buildUrlWithParams(dashboardPage.osNodesOverview.clearUrl, {
      from: 'now-15m',
      environment: expectedEnvName,
    }));
    await dashboardPage.waitForDashboardOpened();
    await dashboardPage.expandEachDashboardRow();
    await dashboardPage.verifyThereAreNoGraphsWithoutData(3);
  },
);
