import { test } from '@playwright/test';
import * as cli from '@helpers/cliHelper';

const MYSQL_USER = 'root'
const MYSQL_PASSWORD = "pass"
const host = '127.0.0.1:3308' //todo

test.describe('PMM Client CLI tests for MySQL', async () => {

  /**
   * @link 
   */
  test('run pmm-admin add mysql based on running intsancess', async ({ }) => {
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
});