Feature('Generic PMM Server CLI Tests');

AfterSuite(async ({ I }) => {
  await I.verifyCommand('docker rm -f pmm-server-default-scrape');
  await I.verifyCommand('docker rm -f pmm-server-custom-scrape');
  await I.verifyCommand('docker rm -f pmm-client-scrape');
});

After(async ({ I }) => {
  const serverIp = await I.verifyCommand('curl ifconfig.me');
  const username = 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin';

  await I.verifyCommand(`sudo pmm-admin config '--server-url=https://${username}:${password}@0.0.0.0:443' --server-insecure-tls ${serverIp}`);
});

Scenario(
  'PMM-T1201 Verify yum-cron updates are removed from PMM Server @settings',
  async ({ I }) => {
    const pmm_server = await I.verifyCommand('docker ps --format "table {{.ID}}\\t{{.Image}}\\t{{.Names}}" | grep \'pmm-server\' | awk \'{print $3}\'');

    await I.verifyCommand(
      `docker exec ${pmm_server} supervisorctl status | grep cron`,
      '',
      'fail',
    );
    await I.verifyCommand(
      `docker exec ${pmm_server} ps aux | grep cron | grep -v grep`,
      '',
      'fail',
    );
  },
);
Scenario(
  '@PMM-T1664 Verify vm_agents default value of -promscrape.maxScapeSize flag',
  async ({ I }) => {
    const serverIp = await I.verifyCommand('curl ifconfig.me');
    const containerName = 'pmm-server-default-scrape';
    const expectedScrapeSize = '64MiB';

    await I.verifyCommand(`docker run -d -p 1443:443 -p 180:80 --name ${containerName} perconalab/pmm-server:dev-latest`);
    await I.asyncWaitFor(async () => await I.verifyCommand('echo $(curl -s -o /dev/null -w \'%{http_code}\' 0.0.0.0:180/ping)') === '200', 100);

    const containerIp = await I.verifyCommand(`docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${containerName}`);

    await I.verifyCommand(`docker run -d --name pmm-client-scrape --env PMM_AGENT_SETUP=1 --env PMM_AGENT_SERVER_ADDRESS=${containerIp}:443 --env PMM_AGENT_SERVER_USERNAME=admin --env PMM_AGENT_SERVER_PASSWORD=admin --env PMM_AGENT_PORTS_MIN=41000 --env PMM_AGENT_PORTS_MAX=41500 --env PMM_AGENT_SERVER_INSECURE_TLS=1 --env PMM_AGENT_CONFIG_FILE=config/pmm-agent.yaml --env PMM_AGENT_SETUP_NODE_NAME=pmm-client-scrape-container --env PMM_AGENT_SETUP_FORCE=1 --env PMM_AGENT_SETUP_NODE_TYPE=container perconalab/pmm-client:dev-latest`);
    await I.verifyCommand(`sudo pmm-admin config '--server-url=https://admin:admin@0.0.0.0:1443' --server-insecure-tls ${serverIp}`);

    await I.verifyCommand(`ps aux | grep -v 'grep' | grep 'vm_agent' | tail -1 | grep 'promscrape.maxScrapeSize=${expectedScrapeSize}'`);
    await I.verifyCommand(`docker logs pmm-client-scrape 2>&1 | tail -1 | grep 'promscrape.maxScrapeSize="${expectedScrapeSize}"'`);
  },
);

Scenario(
  '@PMM-T1665 Verify that vm_agents -promscrape.maxScapeSize flag value can be set by user',
  async ({ I }) => {
    const serverIp = await I.verifyCommand('curl ifconfig.me');
    const containerName = 'pmm-server-custom-scrape';
    const expectedScrapeSize = '128MiB';

    await I.verifyCommand(`docker run -d -p 2443:443 -p 280:80 --name ${containerName} --env PMM_PROMSCRAPE_MAX_SCRAPE_SIZE=128MiB perconalab/pmm-server:dev-latest`);
    await I.asyncWaitFor(async () => await I.verifyCommand('echo $(curl -s -o /dev/null -w \'%{http_code}\' 0.0.0.0:280/ping)') === '200', 100);

    const containerIp = await I.verifyCommand(`docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ${containerName}`);

    await I.verifyCommand(`docker run -d --name pmm-client-scrape --env PMM_AGENT_SETUP=1 --env PMM_AGENT_SERVER_ADDRESS=${containerIp}:443 --env PMM_AGENT_SERVER_USERNAME=admin --env PMM_AGENT_SERVER_PASSWORD=admin --env PMM_AGENT_PORTS_MIN=41000 --env PMM_AGENT_PORTS_MAX=41500 --env PMM_AGENT_SERVER_INSECURE_TLS=1 --env PMM_AGENT_CONFIG_FILE=config/pmm-agent.yaml --env PMM_AGENT_SETUP_NODE_NAME=pmm-client-scrape-container --env PMM_AGENT_SETUP_FORCE=1 --env PMM_AGENT_SETUP_NODE_TYPE=container perconalab/pmm-client:dev-latest`);
    await I.verifyCommand(`sudo pmm-admin config '--server-url=https://admin:admin@0.0.0.0:2443' --server-insecure-tls ${serverIp}`);

    await I.verifyCommand(`ps aux | grep -v 'grep' | grep 'vm_agent' | tail -1 | grep 'promscrape.maxScrapeSize=${expectedScrapeSize}'`);
    await I.verifyCommand(`docker logs pmm-client-scrape 2>&1 | tail -1 | grep 'promscrape.maxScrapeSize="${expectedScrapeSize}"'`);
  },
);
