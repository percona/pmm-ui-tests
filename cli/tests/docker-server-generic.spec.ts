import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cliHelper';

const DOCKER_IMAGE = process.env.DOCKER_VERSION.length > 0
    ? process.env.DOCKER_VERSION
    : 'perconalab/pmm-server:dev-latest';

test.describe('PMM Server CLI tests for Docker Environment Variables', async () => {

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/docker-env-variable-tests.bats#L7
   */
  test('PMM-T224 run docker container with a invalid value for a environment variable DATA_RETENTION=48', async ({}) => {
    await cli.exec(`docker run -d -p 81:80 -p 446:443 --name PMM-T224 -e DATA_RETENTION=48 ${DOCKER_IMAGE}`);
    //TODO: implement fluent wait instead of sleep
    await cli.exec('sleep 60');
    await (await cli.exec('docker ps | grep PMM-T224')).exitCodeEquals(1);
    await (await cli.exec('docker logs PMM-T224 2>&1 | grep "Configuration error: environment variable \"DATA_RETENTION=48\" has invalid duration 48"'))
        .assertSuccess();
    await (await cli.exec('docker rm PMM-T224')).assertSuccess();
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/docker-env-variable-tests.bats#L20
   */
  test('PMM-T225 run docker container with a unexpected environment variable DATA_TENTION=48', async ({}) => {
    await cli.exec(`docker run -d -p 82:80 -p 447:443 --name PMM-T225 -e DATA_TENTION=48 ${DOCKER_IMAGE}}`);
    //TODO: implement fluent wait instead of sleep
    await cli.exec('sleep 20');
    await (await cli.exec('docker ps | grep PMM-T225')).assertSuccess();
    await (await cli.exec('docker logs PMM-T225 2>&1 | grep "Configuration warning: unknown environment variable \"DATA_TENTION=48\""'))
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
      //     run sleep 5
    await (await cli.exec('docker rm PMM-T226')).assertSuccess();
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/docker-env-variable-tests.bats#L53
   */
  test('PMM-T526 Use Invalid Prometheus Custom Config File to Check if Container is unhealthy', async ({}) => {
    await cli.exec(`docker run -d -p 84:80 -p 449:443 --name PMM-T526 ${DOCKER_IMAGE}`);
    //TODO: implement fluent wait instead of sleep
    await cli.exec('sleep 30');
    await (await cli.exec('docker cp ./pmm-tests/broken_prometheus.base.yml PMM-T526:/srv/prometheus/prometheus.base.yml')).assertSuccess();
    await cli.exec('docker restart PMM-T526');
    await cli.exec('sleep 30');
    await (await cli.exec(`bash -c "echo $(docker ps --format '{{.Names}}\\t{{.Status}}' | grep PMM-T526 | awk -F' ' '{print $5}' | awk -F'(' '{print $2}' | awk -F')' '{print $1}')"`))
        .outContains('unhealthy');
    await (await cli.exec('docker stop PMM-T526')).assertSuccess();
    await (await cli.exec('docker rm PMM-T526')).assertSuccess();
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/docker-env-variable-tests.bats#L67
   */
  test('Basic Sanity using Clickhouse shipped with PMM-Server, Check Connection, Run a Query', async ({}) => {
    await (await cli.exec(`'clickhouse-client --database pmm --query "select any(example),sum(num_queries) cnt, max(m_query_time_max) slowest  from metrics where period_start>subtractHours(now(),6)  group by queryid order by slowest desc limit 10"'`))
        .assertSuccess();

    // Check PMM Database Exist
    let output = await cli.exec(`echo $(clickhouse-client --query 'SELECT * FROM system.databases' | grep pmm | awk -F' ' '{print $1}')`);
    await output.assertSuccess();
    await output.outContains('pmm');

    // Check Data path matches expected Value
    output = await cli.exec(`echo $(clickhouse-client --query 'SELECT * FROM system.databases' | grep pmm | awk -F' ' '{print $3}')`);
    await output.assertSuccess();
    await output.outContains('/srv/clickhouse/data/pmm/');

    //   ## Check Metadata path matches expected Value
    output = await cli.exec(`echo $(clickhouse-client --query 'SELECT * FROM system.databases' | grep pmm | awk -F' ' '{print $4}')`);
    await output.assertSuccess();
    await output.outContains('/srv/clickhouse/metadata/pmm/');
  });
});
