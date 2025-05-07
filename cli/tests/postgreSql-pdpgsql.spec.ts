import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cli-helper';

const PGSQL_USER = 'postgres';
const PGSQL_PASSWORD = 'pass+this';
const ipPort = '127.0.0.1:5432';

let containerName: string;

enum PgAgent {
  PGSTATMONITOR_AGENT = 'postgresql_pgstatmonitor_agent',
  PGSTATEMENTS_AGENT = 'postgresql_pgstatements_agent',
}

const waitForAgentRunning = async (agentName = PgAgent.PGSTATMONITOR_AGENT) => {
  await test.step('Check that pgstatmonitor agent is running', async () => {
    await expect(async () => {
      const output = await cli.exec(`docker exec ${containerName} pmm-admin inventory list agents`);
      await output.assertSuccess();
      await output.outContains('postgres_exporter Running');
      await output.outContains(`${agentName} Running`);
    }).toPass({
      intervals: [2_000],
      timeout: 30_000,
    });
  });
};

const removeService = async (serviceName: string) => {
  await test.step(`remove "${serviceName}" service`, async () => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin remove postgresql ${serviceName}`);
    await output.assertSuccess();
    await output.outContains('Service removed.');
  });
};

test.describe('Percona Distribution for PostgreSQL CLI tests', async () => {
  test.beforeAll(async ({}) => {
    const result = await cli.exec('docker ps --format \'{{.Names}}\' | grep \'^pdpgsql_pgsm_pmm_\'');
    await result.outContains('pdpgsql_pgsm_pmm', 'PDPGSQL docker container should exist. please run pmm-framework with --database pdpgsql');
    containerName = result.stdout.trim();
    // const output = await cli.exec(`sudo pmm-admin add postgresql --query-source=pgstatmonitor --username=${PGSQL_USER} --password=${PGSQL_PASSWORD} prerequisite ${ipPort}`);
    // await output.assertSuccess();
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L10
   */
  test('PMM-T442 run pmm-admin add postgreSQL with pgstatmonitor', async ({}) => {
    const serviceName = 'pgstatmonitor_pg';
    await test.step('add pg with pgstatmonitor for monitoring', async () => {
      const output = await cli.exec(`docker exec ${containerName} pmm-admin add postgresql --query-source=pgstatmonitor --username=${PGSQL_USER} --password=${PGSQL_PASSWORD} ${serviceName} ${ipPort}`);
      await output.assertSuccess();
      await output.outContains('PostgreSQL Service added.');
    });

    await waitForAgentRunning();
    await removeService(serviceName);
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L34
   */
  test('PMM-T442 run pmm-admin add postgreSQL with default query source', async ({}) => {
    const serviceName = 'default_query_source_pg';
    await test.step('add pg with default query source for monitoring', async () => {
      const output = await cli.exec(`docker exec ${containerName} pmm-admin add postgresql --username=${PGSQL_USER} --password=${PGSQL_PASSWORD} ${serviceName} ${ipPort}`);
      await output.assertSuccess();
      await output.outContains('PostgreSQL Service added.');
    });

    await waitForAgentRunning();
    await removeService(serviceName);
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L49
   */
  test('run pmm-admin add postgreSQL with default query source and metrics mode push', async ({}) => {
    const serviceName = 'default_query_source_push_metrics_pg';
    await test.step('add pg with default query source and metrics mode push for monitoring', async () => {
      const output = await cli.exec(`docker exec ${containerName} pmm-admin add postgresql --username=${PGSQL_USER} --password=${PGSQL_PASSWORD} --metrics-mode=push ${serviceName} ${ipPort}`);
      await output.assertSuccess();
      await output.outContains('PostgreSQL Service added.');
    });

    await waitForAgentRunning();
    await removeService(serviceName);
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L64
   */
  test('run pmm-admin add postgreSQL with default query source and metrics mode pull', async ({}) => {
    const serviceName = 'default_query_source_pull_metrics_pg';
    await test.step('add pg with default query source and metrics mode pull for monitoring', async () => {
      const output = await cli.exec(`docker exec ${containerName} pmm-admin add postgresql --username=${PGSQL_USER} --password=${PGSQL_PASSWORD} --metrics-mode=pull ${serviceName} ${ipPort}`);
      await output.assertSuccess();
      await output.outContains('PostgreSQL Service added.');
    });

    await waitForAgentRunning();
    await removeService(serviceName);
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pdpgsql-tests.bats#L291
   */
  test('PMM-T963 run pmm-admin add postgresql with --agent-password flag', async ({}) => {
    const serviceName = 'pg_agent_password';
    await test.step('add pg with --agent-password for monitoring', async () => {
      const output = await cli.exec(`docker exec ${containerName} pmm-admin add postgresql --username=${PGSQL_USER} --password=${PGSQL_PASSWORD} --agent-password=mypass ${serviceName} ${ipPort}`);
      await output.assertSuccess();
      await output.outContains('PostgreSQL Service added.');
    });

    await waitForAgentRunning();

    await expect(async () => {
      const metrics = await cli.getMetrics(serviceName, 'pmm', 'mypass', containerName);
      const expectedValue = 'pg_up{collector="exporter"} 1';
      expect(metrics, `Scraped metrics do not contain ${expectedValue}!`).toContain(expectedValue);
    }, 'PMM-T963 check metrics from postgres service with custom agent password').toPass({
      intervals: [2_000],
      timeout: 60_000,
    });

    // PMM-T963 run pmm-admin remove postgresql added with custom agent password
    await removeService(serviceName);
  });

  test('PMM-T1833 Verify validation for auto-discovery-limit option for adding Postgres', async ({}) => {
    const inputs = ['wer', '-34535353465757', ''];
    for (const input of inputs) {
      const output = await cli.exec(`docker exec ${containerName} pmm-admin add postgresql --username=${PGSQL_USER} --password=${PGSQL_PASSWORD} --auto-discovery-limit=${input}`);
      await output.stderr.contains(`pmm-admin: error: --auto-discovery-limit: expected a valid 32 bit int but got "${input}"`);
    }
  });

  test('PMM-T1829 Verify turning off autodiscovery database for PostgreSQL', async ({}) => {
    const serviceName = 'autodiscovery_pg';
    await test.step('add pg with --agent-password for monitoring', async () => {
      const output = await cli.exec(`docker exec ${containerName} pmm-admin add postgresql --username=${PGSQL_USER} --password=${PGSQL_PASSWORD} --agent-password=mypass --auto-discovery-limit=2 ${serviceName} ${ipPort}`);
      await output.assertSuccess();
      await output.outContains('PostgreSQL Service added.');
    });

    let agentIds: string[] = [];

    await expect(async () => {
      const jsonList = JSON.parse((await cli.exec(`docker exec ${containerName} pmm-admin list --json`)).stdout);
      // eslint-disable-next-line max-len
      const serviceIds = jsonList.service.filter((s: { service_name: string; }) => s.service_name === serviceName).map((s: { service_id: never; }) => s.service_id);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      agentIds = jsonList.agent.filter((a: { agent_type: string; status: string; service_id: string | null }) => a.agent_type === 'AGENT_TYPE_POSTGRES_EXPORTER'
       && a.status === 'RUNNING'
       && serviceIds.includes(a.service_id)).map((a: { agent_id: string }) => a.agent_id);

      expect(agentIds.length).toBeTruthy();
    }).toPass({
      intervals: [2_000],
      timeout: 30_000,
    });

    for (const agentId of agentIds) {
      const psAuxOutput = await cli.exec(`docker exec ${containerName} ps aux |awk '/postgres_exporter/ && /${agentId}/'`);
      await psAuxOutput.assertSuccess();
      await psAuxOutput.outNotContains('--auto-discover-databases');
      await psAuxOutput.outContains('postgres_exporter --collect');
    }

    await removeService(serviceName);
  });

  test('PMM-T1828 Verify auto-discovery-database flag is enabled by default for postgres_exporter', async ({}) => {
    const output = await cli.exec('ps aux |grep postgres_exporter');
    await output.assertSuccess();
    await output.outContains('postgres_exporter --auto-discover-databases ');
  });
});
