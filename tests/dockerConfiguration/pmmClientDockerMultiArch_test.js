Feature('Test PMM client multi arch docker container').retry(1);

BeforeSuite(async ({ I }) => {
  const DOCKER_IMAGE = process.env.DOCKER_VERSION || 'perconalab/pmm-client-test:dev-latest';
  const SERVER_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';

  await I.verifyCommand(`docker run 
          --rm \
          --name pmm-client \
          -e PMM_AGENT_SERVER_ADDRESS=pmm-server \
          -e PMM_AGENT_SERVER_USERNAME=admin \
          -e PMM_AGENT_SERVER_PASSWORD=${SERVER_PASSWORD} \
          -e PMM_AGENT_SERVER_INSECURE_TLS=1 \
          -e PMM_AGENT_SETUP=1 \
          -e PMM_AGENT_CONFIG_FILE=config/pmm-agent.yaml \
          --volumes-from pmm-client-data \
          ${DOCKER_IMAGE}`);
});

Before(async ({ I }) => {
  await I.Authorize();
});

Scenario('Verify that dashboards contain data @client-docker-multi-arch', async ({ I }) => {
  I.say('Test');
});
