import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cli-helper';
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
      out = await cli.exec('docker logs PMM-T224 2>&1 | grep \'Configuration error: environment variable\'');
      await out.exitCodeEquals(0)
    }).toPass({
      // Probe, wait 1s, probe, wait 2s, probe, wait 2s, probe, wait 2s, probe, ....
      intervals: [1_000, 2_000, 2_000],
      timeout: 60_000
    });
    // Extra escaping due to bug# PMM-12450, remove once fixed.
    await out.outContains('Configuration error: environment variable \\"DATA_RETENTION=48\\" has invalid duration 48.')
    await (await cli.exec('docker rm PMM-T224')).assertSuccess();
      const scrapeSizeLog = await cli.exec(`docker logs ${clientContainer} 2>&1 | grep 'promscrape.maxScrapeSize.*vm_agent' | tail -1`);
      await scrapeSizeLog.outContains(`promscrape.maxScrapeSize=\\\"${customScrapeSize}MiB\\\"`);
    }).toPass({ intervals: [2_000], timeout: 10_000 });
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
      out = await cli.exec(`docker logs PMM-T225 2>&1 | grep 'Configuration warning: unknown environment variable'`);
      await out.exitCodeEquals(0)
    }).toPass({
      // Probe, wait 1s, probe, wait 2s, probe, wait 2s, probe, wait 2s, probe, ....
      intervals: [1_000, 2_000, 2_000],
      timeout: 60_000
    });
    // Extra escaping due to bug# PMM-12450, remove once fixed.
    await out.outContains('Configuration warning: unknown environment variable \\"DATA_TENTION=48\\".')
    await (await cli.exec('docker stop PMM-T225')).assertSuccess();
    await (await cli.exec('docker rm PMM-T225')).assertSuccess();
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/docker-env-variable-tests.bats#L35
   */
  test('PMM-T226 run docker container with all valid environment variables not causing any warning or error message', async ({}) => {
    await cli.exec(`docker run -d -p 83:80 -p 447:443 \ 
    --name PMM-T226 -e DATA_RETENTION=48h -e DISABLE_UPDATES=true -e DISABLE_TELEMETRY=false \ 
    -e METRICS_RESOLUTION=24h -e METRICS_RESOLUTION_LR=24h -e METRICS_RESOLUTION_MR=24h ${DOCKER_IMAGE}`);
    //TODO: implement fluent wait instead of sleep
    await cli.exec('sleep 20');
    await (await cli.exec('docker ps | grep PMM-T226')).assertSuccess();
    await expect(async () => {
      const out = await cli.exec('docker logs PMM-T226 2>&1 | grep "warning"');
      await out.exitCodeEquals(1)
    }).toPass({
      // Probe, wait 1s, probe, wait 2s, probe, wait 2s, probe, wait 2s, probe, ....
      intervals: [1_000, 2_000, 2_000],
      timeout: 60_000
    });

    await expect(async () => {
      const out = await cli.exec('docker logs PMM-T226 2>&1 | grep "error"');
      await out.exitCodeEquals(1)
      const scrapeSizeLog = await cli.exec('ps aux | grep -v \'grep\' | grep \'vm_agent\' | tail -1');
      await scrapeSizeLog.outContains(`promscrape.maxScrapeSize=${customScrapeSize}MiB`);
    }).toPass({ intervals: [2_000], timeout: 10_000 });
    // TODO: move out to aftereach
    await (await cli.exec('sudo pmm-admin config --force \'--server-url=https://admin:admin@0.0.0.0:443\' --server-insecure-tls 127.0.0.1 || true')).logError();
  });

  test('@PMM-T1861 PMM does not honor the environment variables for VictoriaMetrics', async () => {
    const search_maxQueryLen ='1';
    const search_maxQueryDuration ='100';
    const search_latencyOffset= '6';
    const search_maxQueueDuration='40';
    const search_logSlowQueryDuration='40';
    const search_maxSamplesPerQuery = '1500000000';
    const serverContainer = 'PMM-T1861';
    await (await cli.exec(`docker run -d --restart always -p 290:80 -p 2443:443 --name ${serverContainer} 
    -e VM_search_maxQueryLen=${search_maxQueryLen}MB 
    -e VM_search_maxQueryDuration=${search_maxQueryDuration}s 
    -e VM_search_latencyOffset=${search_latencyOffset}s 
    -e VM_search_maxQueueDuration=${search_maxQueueDuration}s 
    -e VM_search_logSlowQueryDuration=${search_logSlowQueryDuration}s 
    -e VM_search_maxSamplesPerQuery=${search_maxSamplesPerQuery} 
    ${DOCKER_IMAGE}`)).assertSuccess();
    stopList.push(serverContainer);
    removeList.push(serverContainer);
    await waitForApiReady('127.0.0.1', 290);

    await expect(async () => {
      const scrapeSizeLog = await cli.exec(`docker exec ${serverContainer} cat /etc/supervisord.d/victoriametrics.ini`);
      await scrapeSizeLog.outContainsMany([`--search.maxQueryLen=${search_maxQueryLen}MB`,
        `--search.maxQueryDuration=${search_maxQueryDuration}s`,
        `--search.latencyOffset=${search_latencyOffset}s`,
        `--search.maxQueueDuration=${search_maxQueueDuration}s`,
        `--search.logSlowQueryDuration=${search_logSlowQueryDuration}s`,
        `--search.maxSamplesPerQuery=${search_maxSamplesPerQuery}`]);
    }).toPass({
      // Probe, wait 1s, probe, wait 2s, probe, wait 2s, probe, wait 2s, probe, ....
      intervals: [1_000, 2_000, 2_000],
      timeout: 10_000,
    });
  });
});
