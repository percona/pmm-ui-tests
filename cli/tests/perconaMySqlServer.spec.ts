import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cli-helper';

const MYSQL_USER = 'msandbox';
const MYSQL_PASSWORD = 'msandbox';
let mysqlDbHosts: string[];
const ipPort = '127.0.0.1:3317';

const grepServicesCmd = (serviceName: string) => {
  return `sudo pmm-admin list | grep "MySQL" | grep "${serviceName}" | awk -F" " '{print $2}'`;
};

test.describe('PMM Client CLI tests for Percona Server Database', async () => {
  test.beforeAll(async ({}) => {
    const output = await cli.exec(`sudo pmm-admin add mysql --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} prerequisite ${ipPort}`);
    await output.assertSuccess();
    mysqlDbHosts = (await cli.exec('sudo pmm-admin list | grep "MySQL" | awk -F" " \'{print $3}\''))
      .getStdOutLines();
  });

  test.afterAll(async ({}) => {
    const output = await cli.exec('sudo pmm-admin remove mysql prerequisite');
    await output.assertSuccess();
  });
  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L9
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L19
   */
  test('run pmm-admin ', async ({ }) => {
    const output = await cli.exec('sudo pmm-admin');
    await output.exitCodeEquals(1);
    await output.outContains('Usage: pmm-admin <command>');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L29
   */
  test('run pmm-admin add mysql based on running instances', async ({ }) => {
    let n = 1;
    for (const host of mysqlDbHosts) {
      const output = await cli.exec(`sudo pmm-admin add mysql --query-source=perfschema --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} mysql_${n++} ${host}`);
      await output.assertSuccess();
      await output.outContains('MySQL Service added.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L44
   */
  test('run pmm-admin add mysql again based on running instances', async ({ }) => {
    const runningInstancesHosts = (await cli.exec('sudo pmm-admin list | grep "MySQL" | grep "mysql_" | awk -F" " \'{print $3}\''))
      .getStdOutLines();
    let n = 1;
    for (const host of runningInstancesHosts) {
      const output = await cli.exec(`sudo pmm-admin add mysql --query-source=perfschema --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} mysql_${n++} ${host}`);
      await output.exitCodeEquals(1);
      await output.outContains('already exists.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L57
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L81
   */
  test('run pmm-admin status --json check for Running string in output', async ({ }) => {
    const output = await cli.exec('sudo pmm-admin status --json');
    await output.assertSuccess();
    await output.outContains('RUNNING');
    await output.outNotContains('Running');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L69
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L75
   */
  test('run pmm-admin status check for Running string in output', async ({ }) => {
    const output = await cli.exec('sudo pmm-admin status');
    await output.assertSuccess();
    await output.outContains('Running');
    await output.outNotContains('RUNNING');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L63
   */
  test('run pmm-admin status check for RUNNING string in output for VM_AGENT', async ({ }) => {
    await expect(async () => {
      await (await cli.exec('sudo pmm-admin status | grep "vmagent Running"'))
        .assertSuccess();
    }).toPass({ intervals: [1_000], timeout: 5_000 });
  });

  test('run pmm-admin status check for RUNNING string in output for MYSQL_EXPORTER', async ({ }) => {
    await expect(async () => {
      await (await cli.exec('sudo pmm-admin status | grep "mysqld_exporter Running"'))
        .assertSuccess();
    }).toPass({ intervals: [1_000], timeout: 5_000 });
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L87
   */
  test('run pmm-admin list check for msqld_exporter string in output', async ({ }) => {
    const output = await cli.exec('sudo pmm-admin list | grep "msqld_exporter"');
    await output.exitCodeEquals(1);
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L93
   */
  test('run pmm-admin status check for MYSQLD_EXPORTER string in output', async ({ }) => {
    const output = await cli.exec('sudo pmm-admin status | grep "MYSQLD_EXPORTER"');
    await output.exitCodeEquals(1);
  });

  /**
    * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L99
   */
  test('run pmm-admin list --json check for msqld_exporter string in output', async ({ }) => {
    const output = await cli.exec('sudo pmm-admin list --json | grep "msqld_exporter"');
    await output.exitCodeEquals(1);
  });

  /**
    * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L105
   */
  test('run pmm-admin list --json check for MYSQLD_EXPORTER string in output', async ({ }) => {
    const output = await cli.exec('sudo pmm-admin status --json | grep "MYSQLD_EXPORTER"');
    await output.assertSuccess();
  });

  /**
  * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L111
 */
  test('run pmm-admin remove mysql added with basic', async ({ }) => {
    const services = (await cli.exec(grepServicesCmd('mysql_'))).getStdOutLines();
    for (const service of services) {
      const output = await cli.exec(`sudo pmm-admin remove mysql ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L158
   */
  test('run pmm-admin add mysql based on running instances using host, port and service name', async ({ }) => {
    let n = 1;
    for (const host of mysqlDbHosts) {
      const ip = host.split(':')[0];
      const port = host.split(':')[1];
      const output = await cli.exec(`sudo pmm-admin add mysql --query-source=perfschema --username=${MYSQL_USER} --password=${MYSQL_PASSWORD}  --host=${ip} --port=${port} --service-name=mysql_${n++}`);
      await output.assertSuccess();
      await output.outContains('MySQL Service added.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L174
   */
  test('run pmm-admin remove mysql added using host, port and servicename', async ({ }) => {
    const services = (await cli.exec(grepServicesCmd('mysql_'))).getStdOutLines();
    for (const service of services) {
      const output = await cli.exec(`sudo pmm-admin remove mysql ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L186
   */
  test('run pmm-admin add mysql with both disable-tablestats and disable-tablestats-limit', async ({ }) => {
    let n = 1;
    for (const host of mysqlDbHosts) {
      const output = await cli.exec(`sudo pmm-admin add mysql --query-source=perfschema --disable-tablestats --disable-tablestats-limit=50 --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} mysql_${n++} ${host}`);
      await output.exitCodeEquals(1);
      await output.outContains('both --disable-tablestats and --disable-tablestats-limit are passed');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L200
   */
  test('run pmm-admin add mysql with disable-tablestats', async ({ }) => {
    let n = 1;
    for (const host of mysqlDbHosts) {
      const output = await cli.exec(`sudo pmm-admin add mysql --query-source=perfschema --disable-tablestats --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} mysql_${n++} ${host}`);
      await output.assertSuccess();
      await output.outContains('Table statistics collection disabled (always).');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L214
   */
  test('run pmm-admin remove mysql add using disable-tablestats', async ({ }) => {
    const services = (await cli.exec(grepServicesCmd('mysql_'))).getStdOutLines();
    for (const service of services) {
      const output = await cli.exec(`sudo pmm-admin remove mysql ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L226
   */
  test('run pmm-admin add mysql with disable-tablestats-limit=50', async ({ }) => {
    let n = 1;
    for (const host of mysqlDbHosts) {
      const output = await cli.exec(`sudo pmm-admin add mysql --query-source=perfschema --disable-tablestats-limit=50 --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} mysql_${n++} ${host}`);
      await output.assertSuccess();
      await output.outContains('Table statistics collection disabled');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L240
   */
  test('run pmm-admin remove mysql added using disable-tablestats-limit', async ({ }) => {
    const services = (await cli.exec(grepServicesCmd('mysql_'))).getStdOutLines();
    for (const service of services) {
      const output = await cli.exec(`sudo pmm-admin remove mysql ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L252
   */
  test('run pmm-admin remove mysql again', async ({ }) => {
    const services = (await cli.exec(grepServicesCmd('mysql_'))).getStdOutLines();
    for (const service of services) {
      const output = await cli.exec(`sudo pmm-admin remove mysql ${service}`);
      await output.exitCodeEquals(1);
      await output.outContains('not found.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L264
   */
  test('PMM-T962 run pmm-admin add mysql with --agent-password flag', async ({ }) => {
    let n = 1;
    for (const host of mysqlDbHosts) {
      const output = await cli.exec(`sudo pmm-admin add mysql --query-source=perfschema --username=${MYSQL_USER}  --agent-password=mypass --password=${MYSQL_PASSWORD} mysql_${n++} ${host}`);
      await output.assertSuccess();
      await output.outContains('MySQL Service added.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L277
   */
  test('PMM-T962 check metrics from service with custom agent password', async ({ }) => {
    const services = (await cli.exec(grepServicesCmd('mysql_'))).getStdOutLines();
    for (const service of services) {
      // TODO: add fluent wait
      await cli.exec('sleep 20');
      const metrics = await cli.getMetrics(service, 'pmm', 'mypass');
      const expectedValue = 'mysql_up 1';
      expect(metrics, `Scraped metrics do not contain ${expectedValue}!`).toContain(expectedValue);
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L291
   */
  test('run pmm-admin remove mysql added with custom agent password', async ({ }) => {
    const services = (await cli.exec(grepServicesCmd('mysql_'))).getStdOutLines();
    for (const service of services) {
      const output = await cli.exec(`sudo pmm-admin remove mysql ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L303
   */
  test('run pmm-admin add mysql using metrics-mode as push', async ({ }) => {
    let n = 1;
    for (const host of mysqlDbHosts) {
      const mysqlIp = host.split(':')[0];
      const mysqlPort = host.split(':')[1];
      const output = await cli.exec(`sudo pmm-admin add mysql --query-source=perfschema --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} --host=${mysqlIp} --port=${mysqlPort} --service-name=mysql_${n++} --metrics-mode=push`);
      await output.assertSuccess();
      await output.outContains('MySQL Service added.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L319
   */
  test('run pmm-admin remove mysql added via metrics-mode push', async ({ }) => {
    const services = (await cli.exec(grepServicesCmd('mysql_'))).getStdOutLines();
    for (const service of services) {
      const output = await cli.exec(`sudo pmm-admin remove mysql ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L331
   */
  test('run pmm-admin add mysql using metrics-mode as pull', async ({ }) => {
    let n = 1;
    for (const host of mysqlDbHosts) {
      const mysqlIp = host.split(':')[0];
      const mysqlPort = host.split(':')[1];
      const output = await cli.exec(`sudo pmm-admin add mysql --query-source=perfschema --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} --host=${mysqlIp} --port=${mysqlPort} --service-name=mysql_${n++} --metrics-mode=pull`);
      await output.assertSuccess();
      await output.outContains('MySQL Service added.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L347
   */
  test('run pmm-admin remove mysql added via metrics mode pull', async ({ }) => {
    const services = (await cli.exec(grepServicesCmd('mysql_'))).getStdOutLines();
    for (const service of services) {
      const output = await cli.exec(`sudo pmm-admin remove mysql ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L359
   */
  test("PMM-T160 User can't use both socket and address while using pmm-admin add mysql", async ({ }) => {
    let n = 1;
    for (const host of mysqlDbHosts) {
      const mysqlIp = host.split(':')[0];
      const mysqlPort = host.split(':')[1];
      const output = await cli.exec(`sudo  pmm-admin add mysql --query-source=perfschema --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} --host=${mysqlIp} --socket=/tmp/mysql_sandbox${mysqlPort}.sock --service-name=mysql_${n++}`);
      await output.exitCodeEquals(1);
      await output.outContains('Socket and address cannot be specified together.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L375
   */
  test("PMM-T159 User can't use both socket and port while using pmm-admin add mysql", async ({ }) => {
    let n = 1;
    for (const host of mysqlDbHosts) {
      const mysqlPort = host.split(':')[1];
      const output = await cli.exec(`sudo  pmm-admin add mysql --query-source=perfschema --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} --port=${mysqlPort} --socket=/tmp/mysql_sandbox${mysqlPort}.sock --service-name=mysql_${n++}`);
      await output.exitCodeEquals(1);
      await output.outContains('Socket and port cannot be specified together.');
    }
  });
});
