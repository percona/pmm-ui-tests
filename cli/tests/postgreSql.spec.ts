import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cliHelper';

const PGSQL_USER = 'postgres';
const PGSQL_HOST = 'localhost';
const PGSQL_PASSWORD = 'oFukiBRg7GujAJXq3tmd';

test.describe('PMM Client CLI tests for PostgreSQL Data Base', async () => {

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pgsql-specific-tests.bats#L10
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pgsql-specific-tests.bats#L20
   */
  test('run pmm-admin', async ({}) => {
    const sudo = parseInt((await cli.exec('id -u')).stdout) === 0 ? '' : 'sudo ';
    let output = await cli.exec(`${sudo}pmm-admin`);
    await output.exitCodeEquals(1);
    await output.outContains('Usage: pmm-admin <command>');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pgsql-specific-tests.bats#L30
   */
  test('run pmm-admin add postgresql based on running intsances', async ({}) => {
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "PostgreSQL" | awk -F" " '{print $3}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      let output = await cli.exec(`sudo pmm-admin add postgresql --username=${PGSQL_USER} --password=${PGSQL_PASSWORD} pgsql_${n++} ${host}`);
      await output.assertSuccess();
      await output.outContains('PostgreSQL Service added.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pgsql-specific-tests.bats#L43
   */
  test('run pmm-admin add postgresql again based on running instances', async ({}) => {
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "PostgreSQL" | grep "pgsql_" | awk -F" " '{print $3}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      let output = await cli.exec(`sudo pmm-admin add postgresql --username=${PGSQL_USER} --password=${PGSQL_PASSWORD} pgsql_${n++} ${host}`);
      await output.exitCodeEquals(1);
      await output.outContains('already exists.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pgsql-specific-tests.bats#L57
   */
  test('run pmm-admin remove postgresql added with default parameters', async ({}) => {
    let services = (await cli.exec(`sudo pmm-admin list | grep "PostgreSQL" | grep "pgsql_" | awk -F" " '{print $2}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    for (const service of services) {
      let output = await cli.exec(`sudo pmm-admin remove postgresql ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pgsql-specific-tests.bats#L90
   */
  test('run pmm-admin add postgresql based on running intsances using host, port and service name', async ({}) => {
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "PostgreSQL" | awk -F" " '{print $3}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      const ip = host.split(':')[0];
      const port = host.split(':')[1];
      let output = await cli.exec(`sudo pmm-admin add postgresql --username=${PGSQL_USER} --password=${PGSQL_PASSWORD} --host=${ip} --port=${port} --service-name=pgsql_${n++}`);
      await output.assertSuccess();
      await output.outContains('PostgreSQL Service added.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pgsql-specific-tests.bats#L105
   */
  test('run pmm-admin remove postgresql adding using host, port and service name flags', async ({}) => {
    let services = (await cli.exec(`sudo pmm-admin list | grep "PostgreSQL" | grep "pgsql_" | awk -F" " '{print $2}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    for (const service of services) {
      let output = await cli.exec(`sudo pmm-admin remove postgresql ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pgsql-specific-tests.bats#L117
   */
  test('run pmm-admin remove postgresql again', async ({}) => {
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "PostgreSQL" | awk -F" " '{print $3}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      let output = await cli.exec(`sudo pmm-admin remove postgresql pgsql_${n++}`);
      await output.exitCodeEquals(1);
      await output.outContains('not found.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pgsql-specific-tests.bats#L129
   */
  test('PMM-T963 run pmm-admin add postgresql with --agent-password flag', async ({}) => {
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "PostgreSQL" | awk -F" " '{print $3}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      const ip = host.split(':')[0];
      const port = host.split(':')[1];
      let output = await cli.exec(`sudo pmm-admin add postgresql --username=${PGSQL_USER} --password=${PGSQL_PASSWORD} --agent-password=mypass --host=${ip} --port=${port} --service-name=pgsql_${n++}`);
      await output.assertSuccess();
      await output.outContains('PostgreSQL Service added.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pgsql-specific-tests.bats#L144
   */
  test('PMM-T963 check metrics from postgres service with custom agent password', async ({}) => {
    test.skip(true, 'Skipping this test, because of random failure and flaky behaviour');
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "PostgreSQL" | grep "pgsql_" | awk -F" " '{print $3}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    for (const host of hosts) {
      const ip = host.split(':')[0];
      await (await cli.exec('sudo chmod +x /srv/pmm-qa/pmm-tests/pmm-2-0-bats-tests/check_metric.sh')).assertSuccess();
      let output = await cli.exec(`./pmm-tests/pmm-2-0-bats-tests/check_metric.sh pgsql_$COUNTER pg_up ${ip} postgres_exporter pmm mypass`);
      await output.assertSuccess();
      await output.outContains('pg_up 1');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pgsql-specific-tests.bats#L159
   */
  test('PMM-T963 run pmm-admin remove postgresql added with custom agent password', async ({}) => {
    let services = (await cli.exec(`sudo pmm-admin list | grep "PostgreSQL" | grep "pgsql_" | awk -F" " '{print $2}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    for (const service of services) {
      let output = await cli.exec(`sudo pmm-admin remove postgresql ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });
});
