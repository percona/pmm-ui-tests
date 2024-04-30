import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cli-helper';

const MYSQL_USER = 'msandbox';
const MYSQL_PASSWORD = 'msandbox';
const ipPort = '127.0.0.1:3308';

test.describe('Percona Server MySql (PS) Configuration file test ', async () => {
  test.beforeAll(async ({}) => {
    const output = await cli.exec(`sudo pmm-admin add mysql --username=${MYSQL_USER} --password=${MYSQL_PASSWORD} prerequisite ${ipPort}`);
    await output.assertSuccess();
  });

  test.afterAll(async ({}) => {
    const output = await cli.exec('sudo pmm-admin remove mysql prerequisite');
    await output.assertSuccess();
  });

  test('PMM-T1471 - Verify that PMM client works with conf files', async ({}) => {
    // Create pmm-admin-mysql.conf file at any folder and put credentials to MySQL to this file in any text editor or using terminal:
    const confFilePath = '/tmp/mysql-credentials.conf';
    await cli.createFile(
      confFilePath,
      `--username=${MYSQL_USER}\n--password=${MYSQL_PASSWORD}`,
      `Create ${confFilePath} file and put credentials to MySQL to this file`,
    );

    const hosts = (await cli.exec('sudo pmm-admin list | grep "MySQL" | awk -F" " \'{print $3}\''))
      .getStdOutLines();
    let n = 1;
    for (const host of hosts) {
      // Add MySQL to monitoring using conf file:
      let output = await cli.exec(`sudo pmm-admin add mysql --query-source=perfschema @${confFilePath} mysql_conf_${n++} ${host}`);
      await output.assertSuccess();
      await output.outContains('MySQL Service added.');

      // Check that MySQL exporter is RUNNING:
      const serviceId = output.getStdOutLines().find((item) => item.includes('/service_id/'))!.trim()
        .split(':')
        .find((item) => item.includes('/service_id/'))!
        .trim();
      await expect(async () => {
        output = await cli.exec(`sudo pmm-admin list | grep _exporter | grep ${serviceId}`);
        await output.outContains('Running');
      }).toPass({ intervals: [2_000], timeout: 10_000 });
    }
  });

  test('run pmm-admin remove mysql added using current running instances', async ({ }) => {
    const services = (await cli.exec('sudo pmm-admin list | grep "MySQL" | grep "mysql_" | awk -F" " \'{print $2}\''))
      .getStdOutLines();
    for (const service of services) {
      const output = await cli.exec(`sudo pmm-admin remove mysql ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });
});
