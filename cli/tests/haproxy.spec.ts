import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cliHelper';


test.describe('HAProxy service CLI tests ', async () => {

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L5
   */
  test('PMM-T655 - Verify adding HAProxy as service', async ({}) => {
    let output = (await cli.exec(`docker exec HAPROXY pmm-admin add haproxy --listen-port=42100 haproxyServiceCLI1`));
    await output.assertSuccess();
    await output.outContains('HAProxy Service added.');

    output = await cli.exec(`docker exec HAPROXY pmm-admin list`);
    await output.assertSuccess();
    await output.outContains('external-exporter        Unknown');
    await output.outContains('haproxyServiceCLI1');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L17
   */
  test('PMM-T657 - Verify skip-connection-check option while adding HAProxy service', async ({}) => {
    let output = (await cli.exec(`docker exec HAPROXY pmm-admin add haproxy --listen-port=8455 --skip-connection-check haproxyServiceCLI2`));
    await output.assertSuccess();
    await output.outContains('HAProxy Service added.');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L24
   */
  test('Remove HAProxy with connection check', async ({}) => {
    let output = await cli.exec(`docker exec HAPROXY pmm-admin remove haproxy haproxyServiceCLI2`);
    await output.assertSuccess();
    await output.outContains('Service removed.');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L31
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L45
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L52
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L59
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L59
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L66
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L73
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L80
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L87
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L94
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L101
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L108
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L115
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L122
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L129
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L136
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L143
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L150
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L157
   */
  test('PMM-T674 - Verify help for adding HAProxy service', async ({}) => {
    const output = await cli.exec('docker exec HAPROXY pmm-admin add haproxy --help');
    await output.assertSuccess();
    await output.outContainsMany([
      'help',
      "version",
      'server-url=SERVER-URL',
      'server-insecure-tls',
      'debug',
      'trace',
      'json',
      'username=STRING',
      'password=STRING',
      'scheme=http or https',
      'metrics-path=/metrics',
      'listen-port=port',
      'node-id=STRING ',
      'environment=prod',
      'cluster=east-cluster',
      'replication-set=rs1',
      'custom-labels=KEY=VALUE,...',
      'metrics-mode="auto"',
      'skip-connection-check',
    ]);
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L164
   */
  test('PMM-T656 - Verify adding HAProxy service with wrong port', async ({}) => {
    let output = await cli.exec(`docker exec HAPROXY pmm-admin add haproxy --listen-port=8444`);
    await output.exitCodeEquals(1);
    await output.outContains('Connection check failed: Get "http://127.0.0.1:8444/metrics": dial tcp 127.0.0.1:8444: connect: connection refused.');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/haproxy-tests.bats#L171
   */
  test('PMM-T705 - Remove HAProxy service', async ({}) => {
    let output = await cli.exec(`docker exec HAPROXY pmm-admin remove haproxy haproxyServiceCLI1`);
    await output.assertSuccess();
    await output.outContains('Service removed.');
  });
});
