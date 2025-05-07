import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cli-helper';
import { removeMySQLService } from '@root/helpers/pmm-admin';

const MYSQL_USER = 'msandbox';
const MYSQL_PASSWORD = 'msandbox';
const ipPort = '127.0.0.1:3307';
let containerName: string;

test.describe('PMM Client CLI tests for Percona Server Database', async () => {
  test.beforeAll(async ({}) => {
    const result = await cli.exec('docker ps --format \'{{.Names}}\' | grep \'^ps_pmm\'');
    await result.outContains('ps_pmm', 'Percona MySQL docker container should exist. please run pmm-framework with --database ps');
    containerName = result.stdout.trim();
  });

  test('run pmm-admin add mysql', async ({ }) => {
    const serviceName = 'mysql_1';

    await test.step('run pmm-admin add mysql', async () => {
      const output = await cli.exec(`docker exec ${containerName} pmm-admin add mysql --query-source=perfschema --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} ${serviceName} ${ipPort}`);
      await output.assertSuccess();
      await output.outContains('MySQL Service added.');
    });

    await test.step('run pmm-admin add mysql again', async () => {
      const output = await cli.exec(`docker exec ${containerName} pmm-admin add mysql --query-source=perfschema --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} ${serviceName} ${ipPort}`);
      await output.exitCodeEquals(1);
      await output.outContains('already exists.');
    });

    await removeMySQLService(containerName, serviceName);
  });

  test('run pmm-admin status --json check for Running string in output', async ({ }) => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin status --json`);
    await output.assertSuccess();
    await output.outContains('RUNNING');
  });

  test('run pmm-admin status check for Running string in output', async ({ }) => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin status`);
    await output.assertSuccess();
    await output.outContains('Running');
  });

  test('run pmm-admin status check for RUNNING string in output for VM_AGENT', async ({ }) => {
    await expect(async () => {
      await (await cli.exec(`docker exec ${containerName} pmm-admin status | grep "vmagent.*Running"`))
        .assertSuccess();
    }).toPass({ intervals: [1_000], timeout: 10_000 });
  });

  test('run pmm-admin status check for RUNNING string in output for MYSQL_EXPORTER', async ({ }) => {
    await expect(async () => {
      await (await cli.exec(`docker exec ${containerName} pmm-admin status | grep "mysqld_exporter.*Running"`))
        .assertSuccess();
    }).toPass({ intervals: [1_000], timeout: 10_000 });
  });

  test('run pmm-admin list check for msqld_exporter string in output', async ({ }) => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin list | grep "msqld_exporter"`);
    await output.exitCodeEquals(1);
  });

  test('run pmm-admin status check for MYSQLD_EXPORTER string in output', async ({ }) => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin status | grep "MYSQLD_EXPORTER"`);
    await output.exitCodeEquals(1);
  });

  test('run pmm-admin list --json check for msqld_exporter string in output', async ({ }) => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin list --json | grep "msqld_exporter"`);
    await output.exitCodeEquals(1);
  });

  test('run pmm-admin list --json check for MYSQLD_EXPORTER string in output', async ({ }) => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin status --json | grep "MYSQLD_EXPORTER"`);
    await output.assertSuccess();
  });

  test('run pmm-admin add mysql based on running instances using host, port and service name', async ({ }) => {
    const serviceName = 'mysql_host_port';
    const ip = ipPort.split(':')[0];
    const port = ipPort.split(':')[1];

    const output = await cli.exec(`docker exec ${containerName} pmm-admin add mysql --query-source=perfschema --username=${MYSQL_USER} --password=${MYSQL_PASSWORD}  --host=${ip} --port=${port} --service-name=${serviceName}`);
    await output.assertSuccess();
    await output.outContains('MySQL Service added.');

    await removeMySQLService(containerName, serviceName);
  });

  test('run pmm-admin add mysql with both disable-tablestats and disable-tablestats-limit', async ({ }) => {
    const serviceName = 'mysql_disable_tablestats';
    const output = await cli.exec(`docker exec ${containerName} pmm-admin add mysql --query-source=perfschema --disable-tablestats --disable-tablestats-limit=50 --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} ${serviceName} ${ipPort}`);
    await output.exitCodeEquals(1);
    await output.outContains('both --disable-tablestats and --disable-tablestats-limit are passed');
  });

  test('run pmm-admin add mysql with disable-tablestats', async ({ }) => {
    const serviceName = 'mysql_disable_tablestats';
    const output = await cli.exec(`docker exec ${containerName} pmm-admin add mysql --query-source=perfschema --disable-tablestats --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} ${serviceName} ${ipPort}`);
    await output.assertSuccess();
    await output.outContains('Table statistics collection disabled (always).');

    await removeMySQLService(containerName, serviceName);
  });

  test('run pmm-admin add mysql with disable-tablestats-limit=50', async ({ }) => {
    const serviceName = 'mysql_disable_tablestats_limit';
    const output = await cli.exec(`docker exec ${containerName} pmm-admin add mysql --query-source=perfschema --disable-tablestats-limit=50 --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} ${serviceName} ${ipPort}`);
    await output.assertSuccess();
    await output.outContains('Table statistics collection disabled');

    await removeMySQLService(containerName, serviceName);
  });

  test('run pmm-admin remove non existing mysql', async ({ }) => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin remove mysql non_existing`);
    await output.exitCodeEquals(1);
    await output.outContains('not found.');
  });

  test('PMM-T962 run pmm-admin add mysql with --agent-password flag', async ({ }) => {
    const serviceName = 'mysql_agent_password';
    const output = await cli.exec(`docker exec ${containerName} pmm-admin add mysql --query-source=perfschema --username=${MYSQL_USER}  --agent-password=mypass --password=${MYSQL_PASSWORD} ${serviceName} ${ipPort}`);
    await output.assertSuccess();
    await output.outContains('MySQL Service added.');

    await expect(async () => {
      const metrics = await cli.getMetrics(serviceName, 'pmm', 'mypass', containerName);
      const expectedValue = 'mysql_up 1';
      expect(metrics, `Scraped metrics do not contain ${expectedValue}!`).toContain(expectedValue);
    }).toPass({ intervals: [2_000], timeout: 60_000 });

    await removeMySQLService(containerName, serviceName);
  });

  test('run pmm-admin add mysql using metrics-mode as push', async ({ }) => {
    const serviceName = 'mysql_metrics_mode_push';
    const output = await cli.exec(`docker exec ${containerName} pmm-admin add mysql --query-source=perfschema --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} ${serviceName} ${ipPort} --metrics-mode=push`);
    await output.assertSuccess();
    await output.outContains('MySQL Service added.');

    await removeMySQLService(containerName, serviceName);
  });

  test('run pmm-admin add mysql using metrics-mode as pull', async ({ }) => {
    const serviceName = 'mysql_metrics_mode_pull';
    const output = await cli.exec(`docker exec ${containerName} pmm-admin add mysql --query-source=perfschema --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} ${serviceName} ${ipPort} --metrics-mode=pull`);
    await output.assertSuccess();
    await output.outContains('MySQL Service added.');

    await removeMySQLService(containerName, serviceName);
  });

  test("PMM-T160 User can't use both socket and address while using pmm-admin add mysql", async ({ }) => {
    const serviceName = 'mysql_socket_address';
    const ip = ipPort.split(':')[0];
    const port = ipPort.split(':')[1];

    const output = await cli.exec(`docker exec ${containerName} pmm-admin add mysql --query-source=perfschema --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} --host=${ip} --socket=/tmp/mysql_sandbox${port}.sock --service-name=${serviceName}`);
    await output.exitCodeEquals(1);
    await output.outContains('Socket and address cannot be specified together.');
  });

  test("PMM-T159 User can't use both socket and port while using pmm-admin add mysql", async ({ }) => {
    const serviceName = 'mysql_socket_port';
    const port = ipPort.split(':')[1];

    const output = await cli.exec(`docker exec ${containerName} pmm-admin add mysql --query-source=perfschema --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} --port=${port} --socket=/tmp/mysql_sandbox${port}.sock --service-name=${serviceName}`);
    await output.exitCodeEquals(1);
    await output.outContains('Socket and port cannot be specified together.');
  });
});
