import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cli-helper';

const PGSQL_USER = 'postgres';
const PGSQL_PASSWORD = 'oFukiBRg7GujAJXq3tmd';

test.describe('Percona Distribution for PostgreSQL CLI tests ', async () => {
  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L10
   */
  test('PMM-T442 run pmm-admin add postgreSQL with pgstatmonitor', async ({}) => {
    const hosts = (await cli.exec('sudo pmm-admin list | grep "PostgreSQL" | awk -F" " \'{print $3}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      const output = await cli.exec(`sudo pmm-admin add postgresql --query-source=pgstatmonitor --username=${PGSQL_USER} --password=${PGSQL_PASSWORD} pgstatmonitor_${n} ${host}`);
      await output.assertSuccess();
      await output.outContains('PostgreSQL Service added.');
      await output.outContains(`Service name: pgstatmonitor_${n++}`);
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L25
   */
  test('PMM-T442 run pmm-admin inventory list agents for check agent postgresql_pgstatmonitor_agent', async ({}) => {
    // TODO: implement fluent wait instead of sleep
    await cli.exec('sleep 30');
    const output = await cli.exec('sudo pmm-admin inventory list agents');
    await output.assertSuccess();
    await output.outContains('postgres_exporter           Running');
    await output.outContains('postgresql_pgstatmonitor_agent Running');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L34
   */
  test('PMM-T442 run pmm-admin add postgreSQL with default query source', async ({}) => {
    const hosts = (await cli.exec('sudo pmm-admin list | grep "PostgreSQL" | awk -F" " \'{print $3}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      const output = await cli.exec(`sudo pmm-admin add postgresql --username=${PGSQL_USER} --password=${PGSQL_PASSWORD} pgdefault_${n} ${host}`);
      await output.assertSuccess();
      await output.outContains('PostgreSQL Service added.');
      await output.outContains(`Service name: pgdefault_${n++}`);
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L49
   */
  test('run pmm-admin add postgreSQL with default query source and metrics mode push', async ({}) => {
    const hosts = (await cli.exec('sudo pmm-admin list | grep "PostgreSQL" | awk -F" " \'{print $3}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      const output = await cli.exec(`sudo pmm-admin add postgresql --username=${PGSQL_USER} --password=${PGSQL_PASSWORD} --metrics-mode=push pgsqlpush_${n} ${host}`);
      await output.assertSuccess();
      await output.outContains('PostgreSQL Service added.');
      await output.outContains(`Service name: pgsqlpush_${n++}`);
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L64
   */
  test('run pmm-admin add postgreSQL with default query source and metrics mode pull', async ({}) => {
    const hosts = (await cli.exec('sudo pmm-admin list | grep "PostgreSQL" | awk -F" " \'{print $3}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      const output = await cli.exec(`sudo pmm-admin add postgresql --username=${PGSQL_USER} --password=${PGSQL_PASSWORD} --metrics-mode=pull pgsqlpull_${n} ${host}`);
      await output.assertSuccess();
      await output.outContains('PostgreSQL Service added.');
      await output.outContains(`Service name: pgsqlpull_${n++}`);
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L79
   */
  test('run pmm-admin remove postgresql with metrics-mode push', async ({}) => {
    const services = (await cli.exec('sudo pmm-admin list | grep "PostgreSQL" | grep "pgsqlpush_" | awk -F" " \'{print $2}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    for (const service of services) {
      const output = await cli.exec(`sudo pmm-admin remove postgresql ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L91
   */
  test('run pmm-admin remove postgresql with metrics-mode pull', async ({}) => {
    const services = (await cli.exec('sudo pmm-admin list | grep "PostgreSQL" | grep "pgsqlpull_" | awk -F" " \'{print $2}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    for (const service of services) {
      const output = await cli.exec(`sudo pmm-admin remove postgresql ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L104
   */
  test('PMM-T442 run pmm-admin inventory list agents for check agent postgresql_pgstatements_agent', async ({}) => {
    const output = await cli.exec('sudo pmm-admin inventory list agents');
    await output.assertSuccess();
    await output.outContains('postgres_exporter           Running');
    await output.outContains('postgresql_pgstatements_agent Running');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L267
   */
  test('run pmm-admin remove postgresql with pgstatmonitor', async ({}) => {
    const services = (
      await cli.exec('sudo pmm-admin list | grep "PostgreSQL" | grep "pgstatmonitor" | awk -F" " \'{print $2}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    for (const service of services) {
      const output = await cli.exec(`sudo pmm-admin remove postgresql ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L279
   */
  test('run pmm-admin remove postgresql with default query source', async ({}) => {
    const services = (await cli.exec('sudo pmm-admin list | grep "PostgreSQL" | grep "pgdefault_" | awk -F" " \'{print $2}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    for (const service of services) {
      const output = await cli.exec(`sudo pmm-admin remove postgresql ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L291
   */
  test('PMM-T963 run pmm-admin add postgresql with --agent-password flag', async ({}) => {
    const hosts = (await cli.exec('sudo pmm-admin list | grep "PostgreSQL" | awk -F" " \'{print $3}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      const ip = host.split(':')[0];
      const port = host.split(':')[1];
      const output = await cli.exec(`sudo pmm-admin add postgresql --username=${PGSQL_USER} --password=${PGSQL_PASSWORD} --agent-password=mypass --host=${ip} --port=${port} --service-name=pgsql_${n++}`);
      await output.assertSuccess();
      await output.outContains('PostgreSQL Service added.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L306
   */
  test('PMM-T963 check metrics from postgres service with custom agent password', async ({}) => {
    test.skip(true, 'Skipping this test, because of random failure and flaky behaviour');
    const hosts = (await cli.exec('sudo pmm-admin list | grep "PostgreSQL" | grep "pgsql_" | awk -F" " \'{print $3}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    for (const host of hosts) {
      const ip = host.split(':')[0];
      // await (await cli.exec('sudo chmod +x /srv/pmm-qa/pmm-tests/pmm-2-0-bats-tests/check_metric.sh')).assertSuccess();
      // let output = await cli.exec(`./pmm-tests/pmm-2-0-bats-tests/check_metric.sh pgsql_$COUNTER pg_up ${ip} postgres_exporter pmm mypass`);
      // await output.assertSuccess();
      // await output.outContains('pg_up 1');
      const metrics = await cli.getMetrics(host, 'pmm', 'mypass', ip);
      const expectedValue = 'pg_up 1';
      expect(metrics, `Scraped metrics do not contain ${expectedValue}!`).toContain(expectedValue);
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L321
   */
  test('PMM-T963 run pmm-admin remove postgresql added with custom agent password', async ({}) => {
    const services = (await cli.exec('sudo pmm-admin list | grep "PostgreSQL" | grep "pgsql_" | awk -F" " \'{print $2}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    for (const service of services) {
      const output = await cli.exec(`sudo pmm-admin remove postgresql ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  test('PMM-T1833 Verify validation for auto-discovery-limit option for adding Postgres', async ({}) => {
    const inputs = ['wer', '-34535353465757', ''];
    for (const input of inputs) {
      const output = await cli.exec(`sudo pmm-admin add postgresql --username=${PGSQL_USER} --password=${PGSQL_PASSWORD} --auto-discovery-limit=${input}`);
      await output.stderr.contains(`pmm-admin: error: --auto-discovery-limit: expected a valid 32 bit int but got "${input}"`);
    }
  });

  test('PMM-T1829 Verify turning off autodiscovery database for PostgreSQL', async ({}) => {
    const hosts = (await cli.exec('sudo pmm-admin list | grep "PostgreSQL" | awk -F" " \'{print $3}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    const n = 1;
    const serviceNames: string[] = [];
    for (const host of hosts) {
      const serviceName = `autodiscovery_${n}`;
      serviceNames.push(serviceName);

      const output = await cli.exec(`sudo pmm-admin add postgresql --username=${PGSQL_USER} --password=${PGSQL_PASSWORD} --auto-discovery-limit=5 ${serviceName} ${host}`);
      await output.assertSuccess();
      await output.outContains('PostgreSQL Service added.');
    }

    let agentIds: string[] = [];

    await expect(async () => {
      const jsonList = JSON.parse((await cli.exec('sudo pmm-admin list --json')).stdout);
      const serviceIds = jsonList.service.filter((s) => serviceNames.includes(s.service_name)).map((s) => s.service_id);
      agentIds = jsonList.agent.filter((a) => a.agent_type === 'POSTGRES_EXPORTER'
          && a.status === 'RUNNING'
          && serviceIds.includes(a.service_id)).map((a) => a.agent_id);

      expect(agentIds.length).toBeTruthy();
    }).toPass({
      intervals: [1_000],
      timeout: 30_000,
    });

    for (const agentId of agentIds) {
      const agentUuid = agentId.split('/')[2];
      const psAuxOutput = await cli.exec(`sudo ps aux |awk '/postgres_exporter/ && /${agentUuid}/'`);
      await psAuxOutput.assertSuccess();
      await psAuxOutput.outNotContains('--auto-discover-databases ');
      await psAuxOutput.outContains('postgres_exporter --collect');
    }
  });

  test('PMM-T1828 Verify auto-discovery-database flag is enabled by default for postgres_exporter', async ({}) => {
    const output = await cli.exec('ps aux |grep postgres_exporter');
    await output.assertSuccess();
    await output.outContains('postgres_exporter --auto-discover-databases ');
  });
});
