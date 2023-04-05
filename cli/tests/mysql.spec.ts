import { test } from '@playwright/test';
import * as cli from '@helpers/cliHelper';

const MYSQL_USER = 'root'
const MYSQL_PASSWORD = "pass"
const host = '127.0.0.1:3308' //todo

test.describe('PMM Client CLI tests for MySQL', async () => {

  /**
   * @link 
   */
  test('run pmm-admin add mysql based on running instances', async ({ }) => {
    let hosts = (await cli.exec(`pmm-admin list | grep "MySQL" | awk -F" " '{print $3}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      let output = await cli.exec(`pmm-admin add mysql --query-source=perfschema --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} mysql_${n++} ${host}`);
      await output.assertSuccess();
      await output.outContains('MySQL Service added.');
    }
  });

  /**
   * @link 
   */
  test('run pmm-admin add mysql again based on running instances', async ({ }) => {
    let hosts = (await cli.exec(`pmm-admin list | grep "MySQL" | grep "mysql_" | awk -F" " '{print $3}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      let output = await cli.exec(`pmm-admin add mysql --query-source=perfschema --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} mysql_${n++} ${host}`);
      await output.exitCodeEquals(1);
      await output.outContains('already exists.');
    }
  });

  /**
  * @link 
 */
  test('run pmm-admin remove mysql added using current running instances', async ({ }) => {
    let hosts = (await cli.exec(`pmm-admin list | grep "MySQL" | grep "mysql_"`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      let output = await cli.exec(`pmm-admin remove mysql mysql_${n++}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link 
   */
  test('run pmm-admin add mysql --help contains disable-tablestats', async ({ }) => {
    const output = await cli.exec('pmm-admin add mysql --help');
    await output.assertSuccess();
    await output.outContains('disable-tablestats');
  });

  /**
   * @link 
   */
  test('run pmm-admin add mysql --help to check metrics-mode=auto', async ({ }) => {
    const output = await cli.exec('pmm-admin add mysql --help');
    await output.assertSuccess();
    await output.outContains(`metrics-mode=\"auto\"`);
  });

  /**
   * @link 
   */
  test('run pmm-admin add mysql --help to check host', async ({ }) => {
    const output = await cli.exec('pmm-admin add mysql --help');
    await output.assertSuccess();
    await output.outContains('host');
  });

  /**
   * @link 
   */
  test('run pmm-admin add mysql --help to check port', async ({ }) => {
    const output = await cli.exec('pmm-admin add mysql --help');
    await output.assertSuccess();
    await output.outContains('port');
  });

  /**
   * @link 
   */
  test('run pmm-admin add mysql --help to check service-name', async ({ }) => {
    const output = await cli.exec('pmm-admin add mysql --help');
    await output.assertSuccess();
    await output.outContains('service-name');
  });

  /**
   * @link 
   */  
  test('run pmm-admin add mysql --help to check socket', async ({ }) => {
    const output = await cli.exec('pmm-admin add mysql --help');
    await output.assertSuccess();
    await output.outContains('socket=STRING');
  });

  /**
   * @link 
   */  
  test('run pmm-admin add mysql --help to check disable-tablestats-limit', async ({ }) => {
    const output = await cli.exec('pmm-admin add mysql --help');
    await output.assertSuccess();
    await output.outContains('disable-tablestats-limit=NUMBER');
  });

  /**
   * @link 
   */
  test('run pmm-admin add mysql --help', async ({ }) => {
    const output = await cli.exec('pmm-admin add mysql --help');
    await output.assertSuccess();
    await output.outContainsMany([
      'help',
      'server-url=SERVER-URL',
      'server-insecure-tls',
      'debug',
      'trace',
      'pmm-agent-listen-port=7777',
      'json',
      'version',
      'socket=STRING',
      'node-id=STRING',
      'pmm-agent-id=STRING',
      'username="root"',
      'password=STRING',
      'agent-password=STRING',
      'query-source="slowlog"',
      'max-query-length=NUMBER',
      'disable-queryexamples',
      'size-slow-logs=size',
      'disable-tablestats',
      'disable-tablestats-limit=NUMBER',
      'environment=STRING',
      'cluster=STRING',
      'replication-set=STRING',
      'custom-labels=KEY=VALUE,...',
      'skip-connection-check',
      'tls',
      'tls-skip-verify',
      'tls-ca=STRING',
      'tls-cert=STRING',
      'tls-key=STRING',
      'metrics-mode="auto"',
      'disable-collectors=DISABLE-COLLECTORS,',
      'service-name=NAME',
      'host=HOST',
      'port=PORT',
      'log-level="warn"',
    ]);
  });

  /**
   * @link
   */
  test('run pmm-admin add mysql based on running instances using host, port and service name', async ({ }) => {
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "MySQL" | awk -F" " '{print $3}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      const ip = host.split(':')[0];
      const port = host.split(':')[1];
      let output = await cli.exec(`sudo pmm-admin add mysql --query-source=perfschema --username=${MYSQL_USER} --password=${MYSQL_PASSWORD}  --host=${ip} --port=${port} --service-name=mysql_${n++}`);
      await output.assertSuccess();
      await output.outContains('MySQL Service added.');
    }
  });

  /**
   * @link
   */
  test('run pmm-admin remove mysql added using host, port and service name', async ({ }) => {
    let services = (await cli.exec(`sudo pmm-admin list | grep "MySQL" | grep "mysql_" | awk -F" " '{print $2}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    for (const service of services) {
      let output = await cli.exec(`sudo pmm-admin remove mysql ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link
   */
  test("PMM-T157 Adding MySQL with specified socket", async ({ }) => {
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "MySQL" | awk -F" " '{print $3}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      const mysql_ip = host.split(':')[0];
      const mysql_port = host.split(':')[1];
      let output = await cli.exec(`sudo pmm-admin add mysql --query-source=perfschema --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} --socket=/tmp/mysql_sandbox${mysql_port}.sock mysql_socket${n++} ${host}`);
      await output.assertSuccess();
      await output.outContains('MySQL Service added.');
    }
  });

  /**
   * @link
   */  
  test("Removing MySQL with specified socket", async ({ }) => {
    let services = (await cli.exec(`sudo pmm-admin list | grep "MySQL" | grep "mysql_socket" | awk -F" " '{print $2}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    for (const service of services) {
      let output = await cli.exec(`sudo pmm-admin remove mysql ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link
   */
  test('run pmm-admin add mysql with both disable-tablestats and disable-tablestats-limit', async ({ }) => {
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "MySQL" | awk -F" " '{print $3}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      let output = await cli.exec(`sudo pmm-admin add mysql --query-source=perfschema --disable-tablestats --disable-tablestats-limit=50 --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} mysql_both${n++} ${host}`);
      await output.exitCodeEquals(1);
      await output.outContains('both --disable-tablestats and --disable-tablestats-limit are passed');
      output = await cli.exec(`sudo pmm-admin list | grep MySQL`);
      await output.outNotContains('mysql_both');
    }
  });  
});