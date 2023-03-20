import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cliHelper';
const shell = require('shelljs');

const MYSQL_USER = 'msandbox';
const MYSQL_PASSWORD = "msandbox";

test.describe('Percona Server MySql (PS) Configuration file test ', async () => {

  test('PMM-T1471 - Verify that PMM client works with conf files', async ({}) => {

    // Create pmm-admin-mysql.conf file at any folder and put credentials to MySQL to this file in any text editor or using terminal:
    const confFilePath = '/tmp/mysql-credentials.conf';
    const configOut = await cli.createFile(confFilePath, `--username=${MYSQL_USER}\n--password=${MYSQL_PASSWORD}`,
        `Create ${confFilePath} file and put credentials to MySQL to this file`);
    await configOut.assertSuccess();

    let hosts = (await cli.exec(`sudo pmm-admin list | grep "MySQL" | awk -F" " '{print $3}'`))
        .stdout.trim().split('\n').filter( item => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      // Add MySQL to monitoring using conf file:
      let output = await cli.exec(`sudo pmm-admin add mysql --query-source=perfschema @${confFilePath} --service-name=mysql_conf_${n++} ${host}`);
      await output.assertSuccess();
      await output.outContains('MySQL Service added.');

      // Check that MySQL exporter is RUNNING:
      const serviceId = output.getStdOutLines().find((item) => item.includes('/service_id/')).trim()
          .split(':').find((item) => item.includes('/service_id/')).trim();
      output = await cli.exec(`sudo pmm-admin list | grep _exporter | grep ${serviceId}`);
      await output.outContains('Running');
    }
  });
});
