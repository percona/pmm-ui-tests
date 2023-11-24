import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cliHelper';
import { waitForApiReady } from '@helpers/custom-assertions';

const DOCKER_IMAGE = process.env.DOCKER_VERSION && process.env.DOCKER_VERSION.length > 0
  ? process.env.DOCKER_VERSION
  : 'perconalab/pmm-server:dev-latest';
const CLIENT_IMAGE = process.env.CLIENT_IMAGE && process.env.CLIENT_IMAGE.length > 0
  ? process.env.CLIENT_IMAGE
  : 'perconalab/pmm-client:dev-latest';
const stopList: string[] = [];
const removeList: string[] = [];

/**
 * TODO: investigate computability mode(the latest server with old client) and exclude tests if they do not work.
 */
test.describe('PMM Server Configuration impacts on client tests', async () => {
  test.afterEach(async () => {
    while (stopList.length > 0) {
      await (await cli.exec(`docker stop ${stopList.shift()}`)).assertSuccess();
    }
    while (removeList.length > 0) {
      await (await cli.exec(`docker rm ${removeList.shift()}`)).assertSuccess();
    }
  });

  test('@PMM-T1665 Verify custom value for vm_agents -promscrape.maxScapeSize parameter for client container', async () => {
    const customScrapeSize = '128';
    const serverContainer = 'PMM-T1665';
    const clientContainer = 'PMM-T1665-client';
    await cli.exec('docker network create -d bridge scrape-interval');

    await (await cli.exec(`docker run -d --restart always -p 279:80 -p 2444:443 --name ${serverContainer}
      -e PMM_DEBUG=1 -e PMM_PROMSCRAPE_MAX_SCRAPE_SIZE=${customScrapeSize}MiB
      --network scrape-interval ${DOCKER_IMAGE}`)).assertSuccess();
    stopList.push(serverContainer);
    removeList.push(serverContainer);
    await waitForApiReady('127.0.0.1', 279);
    await (await cli.exec(`docker run -d --restart always --name ${clientContainer}
      -e PMM_AGENT_SETUP=1
      -e PMM_AGENT_SERVER_ADDRESS=${serverContainer}
      -e PMM_AGENT_SERVER_USERNAME=admin
      -e PMM_AGENT_SERVER_PASSWORD=admin
      -e PMM_AGENT_PORTS_MIN=41000
      -e PMM_AGENT_PORTS_MAX=41500
      -e PMM_AGENT_SERVER_INSECURE_TLS=1
      -e PMM_AGENT_CONFIG_FILE=config/pmm-agent.yaml
      -e PMM_AGENT_SETUP_NODE_NAME=${clientContainer}
      -e PMM_AGENT_SETUP_FORCE=1
      -e PMM_AGENT_SETUP_NODE_TYPE=container
     --network scrape-interval ${CLIENT_IMAGE}`)).assertSuccess();
    stopList.push(clientContainer);
    removeList.push(clientContainer);

    await expect(async () => {
      const scrapeSizeLog = await cli.exec(`docker logs ${clientContainer} 2>&1 | grep 'promscrape.maxScrapeSize.*vm_agent' | tail -1`);
      await scrapeSizeLog.outContains(`promscrape.maxScrapeSize=\\\"${customScrapeSize}MiB\\\"`);
    }).toPass({
      // Probe, wait 1s, probe, wait 2s, probe, wait 2s, probe, wait 2s, probe, ....
      intervals: [1_000, 2_000, 2_000],
      timeout: 10_000,
    });
  });

  // FIXME: skipped until solve conflict with changing pmm-agent config in generic spec
  test.skip('@PMM-T1665 Verify custom value for vm_agents -promscrape.maxScapeSize parameter for local client', async () => {
    const customScrapeSize = '128';
    const serverContainer = 'PMM-T1665-local';
    await (await cli.exec(`docker run -d --restart always -p 280:80 -p 2443:443 --name ${serverContainer}
      -e PMM_DEBUG=1 -e PMM_PROMSCRAPE_MAX_SCRAPE_SIZE=${customScrapeSize}MiB ${DOCKER_IMAGE}`)).assertSuccess();
    stopList.push(serverContainer);
    removeList.push(serverContainer);
    await waitForApiReady('127.0.0.1', 280);
    await (await cli.exec('sudo pmm-admin config node-name=pmm-t1665 --force \'--server-url=https://admin:admin@0.0.0.0:2443\' --server-insecure-tls')).assertSuccess();

    await expect(async () => {
      const scrapeSizeLog = await cli.exec('ps aux | grep -v \'grep\' | grep \'vm_agent\' | tail -1');
      await scrapeSizeLog.outContains(`promscrape.maxScrapeSize=${customScrapeSize}MiB`);
    }).toPass({
      // Probe, wait 1s, probe, wait 2s, probe, wait 2s, probe, wait 2s, probe, ....
      intervals: [1_000, 2_000, 2_000],
      timeout: 10_000,
    });
    // TODO: move out to aftereach
    await (await cli.exec('sudo pmm-admin config --force \'--server-url=https://admin:admin@0.0.0.0:443\' --server-insecure-tls 127.0.0.1 || true')).logError();
  });
});
