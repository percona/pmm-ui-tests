import { test } from '@playwright/test';
import * as cli from '@helpers/cliHelper';

const MYSQL_USER = 'root'
const MYSQL_PASSWORD = "GRgrO9301RuF"

test.describe('PMM Client CLI tests for Percona Server Database', async () => {

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L9
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L19
   */
  test('run pmm-admin ', async ({ }) => {
    const sudo = parseInt((await cli.exec('id -u')).stdout) === 0 ? '' : 'sudo ';
    const output = await cli.exec(`${sudo}pmm-admin`);
    await output.exitCodeEquals(1);
    await output.outContains('Usage: pmm-admin <command>');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L29
   */
  test('run pmm-admin add mysql based on running intsancess', async ({ }) => {
    let hosts = (await cli.exec(`pmm-admin list | grep "MySQL" | awk -F" " '{print $3}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    console.log(hosts);
    for (const host of hosts) {
      let output = await cli.exec(`pmm-admin add mysql --query-source=perfschema --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} mysql_${n++} ${host}`);
      await output.assertSuccess();
      await output.outContains('MySQL Service added.');
    }
  });


  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L44
   */
  test('run pmm-admin add mysql again based on running instances', async ({ }) => {
    let hosts = (await cli.exec(`pmm-admin list | grep "MySQL" | awk -F" " '{print $3}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    console.log(hosts);
    for (const host of hosts) {
      let output = await cli.exec(`pmm-admin add mysql --query-source=perfschema --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} mysql_${n++} ${host}`);
      await output.exitCodeEquals(1);
      await output.outContains('already exists.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L57
   */
  test('run pmm-admin status --json check for RUNNING string in output', async ({ }) => {
    const output = await cli.exec(`pmm-admin status --json | grep "RUNNING"`);
    await output.assertSuccess();
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/ps-specific-tests.bats#L63
   */
  test('run pmm-admin status check for RUNNING string in output for VM_AGENT', async ({ }) => {
    const output = await cli.exec(`pmm-admin status | grep "vmagent Running"`);
    console.log(await cli.exec(`pmm-admin status`));
    await output.assertSuccess();
  });
});
