import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cli-helper';

const PXC_USER = 'admin';
const PXC_PASSWORD = 'admin';
let containerName: string;
const dbHostPort = '127.0.0.1:6032';
const proxysqlServiceName = 'proxysql_1';

test.describe('PMM Client CLI tests for ProxySQL', async () => {
  test.beforeAll(async ({}) => {
    const result = await cli.exec('docker ps | grep pxc_proxysql_pmm | awk \'{print $NF}\'');
    await result.outContains('pxc_proxysql_pmm', 'PROXYSQL docker container should exist. please run pmm-framework with --database pxc');
    containerName = result.stdout.trim();
  });

  test.afterAll(async ({}) => {
    const output = await cli.exec('sudo pmm-admin remove proxysql prerequisite');
    await output.assertSuccess();
  });
  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/proxysql-specific-tests.bats#L10
   */
  test('run pmm-admin add proxysql', async ({}) => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin add proxysql --username=${PXC_USER} --password=${PXC_PASSWORD} --port=6032 ${proxysqlServiceName} ${dbHostPort}`);
    await output.assertSuccess();
    await output.outContains('ProxySQL Service added.');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/proxysql-specific-tests.bats#L25
   */
  test('run pmm-admin add proxysql again based on running instances', async ({}) => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin add proxysql --username=${PXC_USER} --password=${PXC_PASSWORD} --port=6032 ${proxysqlServiceName} ${dbHostPort}`);
    await output.exitCodeEquals(1);
    await output.outContains('already exists.');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/proxysql-specific-tests.bats#L38
   */
  test('run pmm-admin remove proxysql', async ({}) => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin remove proxysql ${proxysqlServiceName}`);
    await output.assertSuccess();
    await output.outContains('Service removed.');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/proxysql-specific-tests.bats#L51
   */
  test('run pmm-admin remove proxysql again', async ({}) => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin remove proxysql ${proxysqlServiceName}`);
    await output.exitCodeEquals(1);
    await output.outContains('not found.');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/proxysql-specific-tests.bats#L63
   */
  test('PMM-T965 run pmm-admin add proxysql with --agent-password flag', async ({}) => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin add proxysql --username=${PXC_USER} --password=${PXC_PASSWORD} --port=6032 --agent-password=mypass ${proxysqlServiceName} ${dbHostPort}`);
    await output.assertSuccess();
    await output.outContains('ProxySQL Service added.');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/proxysql-specific-tests.bats#L76
   */
  test('PMM-T965 check metrics from proxysql service with custom agent password', async ({}) => {
    await cli.exec('sleep 20');
    const metrics = await cli.getMetrics(proxysqlServiceName, 'pmm', 'mypass', containerName);
    const expectedValue = 'proxysql_up 1';
    expect(metrics, `Scraped metrics do not contain ${expectedValue}!`).toContain(expectedValue);
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/proxysql-specific-tests.bats#L91
   */
  test('run pmm-admin remove proxysql added with custom agent password', async ({}) => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin remove proxysql ${proxysqlServiceName}`);
    await output.assertSuccess();
    await output.outContains('Service removed.');
  });
});
