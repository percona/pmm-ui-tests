import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cliHelper';

const DOCKER_IMAGE = process.env.DOCKER_VERSION && process.env.DOCKER_VERSION.length > 0
    ? process.env.DOCKER_VERSION
    : 'perconalab/pmm-server:dev-latest';

test.describe('PMM Server CLI tests for Docker Environment Variables', async () => {

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/docker-env-variable-tests.bats#L7
   */
  test('PMM-T224 run docker container with a invalid value for a environment variable DATA_RETENTION=48', async ({}) => {
    await cli.exec(`docker run -d -p 81:80 -p 446:443 --name PMM-T224 -e DATA_RETENTION=48 ${DOCKER_IMAGE}`);
    await expect(async () => {
      await (await cli.exec('docker ps | grep PMM-T224')).exitCodeEquals(1);
    }).toPass({
      // Probe, wait 1s, probe, wait 2s, probe, wait 2s, probe, wait 2s, probe, ....
      intervals: [1_000, 2_000, 2_000],
      timeout: 60_000
    });
    await (await cli.exec(`docker logs PMM-T224 2>&1 | grep 'Configuration error: environment variable "DATA_RETENTION=48" has invalid duration 48'`))
        .assertSuccess();
    await (await cli.exec('docker rm PMM-T224')).assertSuccess();
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/docker-env-variable-tests.bats#L20
   */
  test('PMM-T225 run docker container with a unexpected environment variable DATA_TENTION=48', async ({}) => {
    await cli.exec(`docker run -d -p 82:80 -p 447:443 --name PMM-T225 -e DATA_TENTION=48 ${DOCKER_IMAGE}`);
    //TODO: implement fluent wait instead of sleep
    // await cli.exec('sleep 20');
    await (await cli.exec('docker ps | grep PMM-T225')).assertSuccess();
    await (await cli.exec(`docker logs PMM-T225 2>&1 | grep 'Configuration warning: unknown environment variable "DATA_TENTION=48"'`))
        .assertSuccess();
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
    await (await cli.exec('docker logs PMM-T226 2>&1 | grep "WARN"')).exitCodeEquals(1);
    await (await cli.exec('docker logs PMM-T226 2>&1 | grep "ERRO"')).exitCodeEquals(1);
    await (await cli.exec('docker stop PMM-T226')).assertSuccess();
    await (await cli.exec('docker rm PMM-T226')).assertSuccess();
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/docker-env-variable-tests.bats#L53
   */
  test('PMM-T526 Use Invalid Prometheus Custom Config File to Check if Container is unhealthy', async ({}) => {
    await cli.exec(`docker run -d -p 84:80 -p 449:443 --name PMM-T526 ${DOCKER_IMAGE}`);
    //TODO: implement fluent wait instead of sleep
    await cli.exec('sleep 30');
    //TODO: implement file creation to remove repo dependency
    const curlCmd = 'curl -o /srv/prometheus/prometheus.base.yml https://raw.githubusercontent.com/percona/pmm-qa/main/pmm-tests/broken_prometheus.base.yml'
    await (await cli.exec(`docker exec PMM-T526 ${curlCmd}`)).assertSuccess();
    await cli.exec('docker restart PMM-T526');
    //TODO: implement fluent wait instead of sleep
    await cli.exec('sleep 30');
    await (await cli.exec(`docker ps --format '{{.Names}}\t{{.Status}}' | grep PMM-T526 | awk -F' ' '{print $5}' | awk -F'(' '{print $2}' | awk -F')' '{print $1}'`))
        .outContains('unhealthy');
    await (await cli.exec('docker stop PMM-T526')).assertSuccess();
    await (await cli.exec('docker rm PMM-T526')).assertSuccess();
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/docker-env-variable-tests.bats#L67
   */
  test('Basic Sanity using Clickhouse shipped with PMM-Server, Check Connection, Run a Query', async ({}) => {
    await (await cli.exec(
        `clickhouse-client \
        --database pmm \
        --query "select any(example),sum(num_queries) cnt, \
        max(m_query_time_max) slowest from metrics where period_start>subtractHours(now(),6) \
        group by queryid order by slowest desc limit 10"`))
        .assertSuccess();

    let output = await cli.exec(
        `clickhouse-client --query 'SELECT * FROM system.databases' | grep pmm | tr -s '[:blank:]' '\\n'`);
    await output.assertSuccess();

    /** Make sure files are in mounted "/srv/" folder */
    const expectedPath = '/srv/clickhouse/';
    expect(output.getStdOutLines()[0], `Verify "pmm" Database Exists`).toEqual('pmm');
    expect(output.getStdOutLines()[1], `Verify Clickhouse engine is "Atomic"`).toEqual('Atomic');
    expect(output.getStdOutLines()[2], `Verify Clickhouse data_path is "${expectedPath}"`).toContain(expectedPath);
    expect(output.getStdOutLines()[3], `Verify Clickhouse metadata_path contains "${expectedPath}"`).toContain(expectedPath);
  });
});

test.describe('-promscrape.maxScapeSize tests', async () => {
  test.beforeAll(async () => {
    await (await cli.exec(`docker-compose -f test-setup/docker-compose-scrape-intervals.yml up -d`)).assertSuccess();
  })

  test.afterAll(async () => {
    await (await cli.exec(`docker-compose -f test-setup/docker-compose-scrape-intervals.yml down`)).assertSuccess();
  })

  test('@PMM-T1665 Verify custom value for vm_agents -promscrape.maxScapeSize parameter', async ({page}) => {
    const customScrapeSize = '128';

    await test.step('verify client docker logs for custom value', async () => {
      const scrapeSizeLog = await cli.exec('docker logs pmm-client-custom-scrape-interval 2>&1 | grep \'promscrape.maxScrapeSize.*vm_agent\' | tail -1');
      await scrapeSizeLog.outContains(`promscrape.maxScrapeSize=\\\"${customScrapeSize}MiB\\\"`)
    })

    await test.step('verify logs from binary for custom value', async () => {
      await (await cli.exec('sudo pmm-admin config --force \'--server-url=https://admin:admin@0.0.0.0:2443\' --server-insecure-tls 127.0.0.1')).assertSuccess()

      await page.waitForTimeout(10_000);
      const scrapeSizeLog = await cli.exec('ps aux | grep -v \'grep\' | grep \'vm_agent\' | tail -1')
      await scrapeSizeLog.outContains(`promscrape.maxScrapeSize=${customScrapeSize}MiB`)
    })
  });
})
