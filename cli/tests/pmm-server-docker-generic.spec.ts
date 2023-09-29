import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cliHelper';
import Output from '@support/types/output';
import { waitForApiReady } from '@helpers/custom-assertions';

const DOCKER_IMAGE = process.env.DOCKER_VERSION && process.env.DOCKER_VERSION.length > 0
  ? process.env.DOCKER_VERSION
  : 'perconalab/pmm-server:dev-latest';
const CLIENT_IMAGE = process.env.CLIENT_IMAGE && process.env.CLIENT_IMAGE.length > 0
  ? process.env.CLIENT_IMAGE
  : 'perconalab/pmm-client:dev-latest';
const stopList: string[] = [];
const removeList: string[] = [];

test.describe('PMM Server CLI tests for Docker Environment Variables', async () => {
  test.afterEach(async () => {
    while (stopList.length > 0) {
      await (await cli.exec(`docker stop ${stopList.shift()}`)).assertSuccess();
    }
    while (removeList.length > 0) {
      await (await cli.exec(`docker rm ${removeList.shift()}`)).assertSuccess();
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/docker-env-variable-tests.bats#L7
   */
  test('PMM-T224 run docker container with a invalid value for a environment variable DATA_RETENTION=48', async ({}) => {
    await cli.exec(`docker run -d -p 81:80 -p 446:443 --name PMM-T224 -e DATA_RETENTION=48 ${DOCKER_IMAGE}`);
    let out: Output;

    await expect(async () => {
      out = await cli.exec('docker logs PMM-T224 2>&1 | grep \'Configuration error: environment variable\'');
      await out.exitCodeEquals(0);
    }).toPass({
      // Probe, wait 1s, probe, wait 2s, probe, wait 2s, probe, wait 2s, probe, ....
      intervals: [1_000, 2_000, 2_000],
      timeout: 60_000,
    });
    removeList.push('PMM-T224');
    // @ts-ignore
    await out.outContains('Configuration error: environment variable \\"DATA_RETENTION=48\\" has invalid duration 48.');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/docker-env-variable-tests.bats#L20
   */
  test('PMM-T225 run docker container with a unexpected environment variable DATA_TENTION=48', async ({}) => {
    await cli.exec(`docker run -d -p 82:80 -p 447:443 --name PMM-T225 -e DATA_TENTION=48 ${DOCKER_IMAGE}`);
    let out: Output;

    await expect(async () => {
      out = await cli.exec('docker logs PMM-T225 2>&1 | grep \'Configuration warning: unknown environment variable\'');
      await out.exitCodeEquals(0);
    }).toPass({
      // Probe, wait 1s, probe, wait 2s, probe, wait 2s, probe, wait 2s, probe, ....
      intervals: [1_000, 2_000, 2_000],
      timeout: 60_000,
    });
    stopList.push('PMM-T225');
    removeList.push('PMM-T225');
    // @ts-ignore
    await out.outContains('Configuration warning: unknown environment variable \\"DATA_TENTION=48\\".');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/docker-env-variable-tests.bats#L35
   */
  test('PMM-T226 run docker container with all valid environment variables not causing any warning or error message', async ({}) => {
    // @ts-ignore
    await cli.exec(`docker run -d -p 83:80 -p 447:443 
    --name PMM-T226 -e DATA_RETENTION=48h -e DISABLE_UPDATES=true -e DISABLE_TELEMETRY=false  
    -e METRICS_RESOLUTION=24h -e METRICS_RESOLUTION_LR=24h -e METRICS_RESOLUTION_MR=24h ${DOCKER_IMAGE}`);
    stopList.push('PMM-T226');
    removeList.push('PMM-T226');
    await waitForApiReady('127.0.0.1', 83);
    await (await cli.exec('docker ps | grep PMM-T226')).assertSuccess();
    await expect(async () => {
      const out = await cli.exec('docker logs PMM-T226 2>&1 | grep "WARN"');
      await out.exitCodeEquals(1);
    }).toPass({
      // Probe, wait 1s, probe, wait 2s, probe, wait 2s, probe, wait 2s, probe, ....
      intervals: [1_000, 2_000, 2_000],
      timeout: 60_000,
    });

    await expect(async () => {
      const out = await cli.exec('docker logs PMM-T226 2>&1 | grep "ERRO"');
      await out.exitCodeEquals(1);
    }).toPass({
      // Probe, wait 1s, probe, wait 2s, probe, wait 2s, probe, wait 2s, probe, ....
      intervals: [1_000, 2_000, 2_000],
      timeout: 60_000,
    });
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/docker-env-variable-tests.bats#L53
   */
  test('PMM-T526 Use Invalid Prometheus Custom Config File to Check if Container is unhealthy', async ({}) => {
    await cli.exec(`docker run -d -p 84:80 -p 449:443 --name PMM-T526 ${DOCKER_IMAGE}`);
    stopList.push('PMM-T526');
    removeList.push('PMM-T526');
    await waitForApiReady('127.0.0.1', 84);
    // TODO: implement file creation to remove repo dependency
    const curlCmd = 'curl -o /srv/prometheus/prometheus.base.yml https://raw.githubusercontent.com/percona/pmm-qa/main/pmm-tests/broken_prometheus.base.yml';
    await (await cli.exec(`docker exec PMM-T526 ${curlCmd}`)).assertSuccess();
    await cli.exec('docker restart PMM-T526');
    await waitForApiReady('127.0.0.1', 84);
    await (await cli.exec('docker ps --format \'{{.Names}}\t{{.Status}}\' | grep PMM-T526 | awk -F\' \' \'{print $5}\' | awk -F\'(\' \'{print $2}\' | awk -F\')\' \'{print $1}\''))
      .outContains('unhealthy');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/docker-env-variable-tests.bats#L67
   */
  test('Basic Sanity using Clickhouse shipped with PMM-Server, Check Connection, Run a Query', async ({}) => {
    await (await cli.exec(
      // eslint-disable-next-line no-multi-str
      'clickhouse-client \
        --database pmm \
        --query "select any(example),sum(num_queries) cnt, \
        max(m_query_time_max) slowest from metrics where period_start>subtractHours(now(),6) \
        group by queryid order by slowest desc limit 10"',
    )).assertSuccess();

    const output = await cli.exec(
      'clickhouse-client --query \'SELECT * FROM system.databases\' | grep pmm | tr -s \'[:blank:]\' \'\\n\'',
    );
    await output.assertSuccess();

    /** Make sure files are in mounted "/srv/" folder */
    const expectedPath = '/srv/clickhouse/';
    expect(output.getStdOutLines()[0], 'Verify "pmm" Database Exists').toEqual('pmm');
    expect(output.getStdOutLines()[1], 'Verify Clickhouse engine is "Atomic"').toEqual('Atomic');
    expect(output.getStdOutLines()[2], `Verify Clickhouse data_path is "${expectedPath}"`).toContain(expectedPath);
    expect(output.getStdOutLines()[3], `Verify Clickhouse metadata_path contains "${expectedPath}"`).toContain(expectedPath);
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

  test('@PMM-T1665 Verify custom value for vm_agents -promscrape.maxScapeSize parameter for local client', async () => {
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
