import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cli-helper';
import ExecReturn from '@support/types/exec-return.class';
import { waitForApiReady } from '@helpers/custom-assertions';

const DOCKER_IMAGE = process.env.DOCKER_VERSION && process.env.DOCKER_VERSION.length > 0
  ? process.env.DOCKER_VERSION
  : 'perconalab/pmm-server:dev-latest';
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
    let out: ExecReturn;

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
    let out: ExecReturn;

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
    const containerName = 'PMM-T526';
    const httpPort = 84;
    await cli.exec(`docker run -d -p ${httpPort}:80 -p 449:443 --name ${containerName} ${DOCKER_IMAGE}`);
    stopList.push(containerName);
    removeList.push(containerName);
    await waitForApiReady('127.0.0.1', httpPort);
    // TODO: implement file creation to remove repo dependency
    const curlCmd = 'curl -o /srv/prometheus/prometheus.base.yml https://raw.githubusercontent.com/percona/pmm-qa/main/pmm-tests/broken_prometheus.base.yml';
    await (await cli.exec(`docker exec ${containerName} ${curlCmd}`)).assertSuccess();
    await cli.exec(`docker restart ${containerName}`);

    await test.step(`Waiting for ${containerName} to be unhealthy(30 sec)`, async () => {
      await expect(async () => {
        await (await cli.exec(`docker ps | grep ${containerName}`))
          .outContains('unhealthy');
      }).toPass({ intervals: [2_000], timeout: 30_000 });
    });
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/docker-env-variable-tests.bats#L67
   */
  test('Basic Sanity using Clickhouse shipped with PMM-Server, Check Connection, Run a Query', async ({}) => {
    await (await cli.exec(
      // eslint-disable-next-line no-multi-str
      'docker exec pmm-server clickhouse-client \
        --database pmm \
        --query "select any(example),sum(num_queries) cnt, \
        max(m_query_time_max) slowest from metrics where period_start>subtractHours(now(),6) \
        group by queryid order by slowest desc limit 10"',
    )).assertSuccess();

    const output = await cli.exec(
      'docker exec pmm-server clickhouse-client --query \'SELECT * FROM system.databases\' | grep pmm | tr -s \'[:blank:]\' \'\\n\'',
    );
    await output.assertSuccess();

    /** Make sure files are in mounted "/srv/" folder */
    const expectedPath = '/srv/clickhouse/';
    expect(output.getStdOutLines()[0], 'Verify "pmm" Database Exists').toEqual('pmm');
    expect(output.getStdOutLines()[1], 'Verify Clickhouse engine is "Atomic"').toEqual('Atomic');
    expect(output.getStdOutLines()[2], `Verify Clickhouse data_path is "${expectedPath}"`).toContain(expectedPath);
    expect(output.getStdOutLines()[3], `Verify Clickhouse metadata_path contains "${expectedPath}"`).toContain(expectedPath);
  });
});
