import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cliHelper';

test.describe('PMM Client CLI tests for ProxySQL', async () => {

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/proxysql-specific-tests.bats#L10
   */
  test('run pmm-admin add proxysql based on running intsances', async ({}) => {
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "ProxySQL" | awk -F" " '{print $3}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      let output = await cli.exec(`docker exec pxc_container_5.7 pmm-admin add proxysql proxysql_${n++} ${host}`);
      await output.assertSuccess();
      await output.outContains('ProxySQL Service added.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/proxysql-specific-tests.bats#L25
   */
  test('run pmm-admin add proxysql again based on running instances', async ({}) => {
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "ProxySQL" | grep "proxysql_" | awk -F" " '{print $3}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      let output = await cli.exec(`docker exec pxc_container_5.7 pmm-admin add proxysql proxysql_${n++} ${host}`);
      await output.exitCodeEquals(1);
      await output.outContains('already exists.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/proxysql-specific-tests.bats#L38
   */
  test('run pmm-admin remove proxysql', async ({}) => {
    let services = (await cli.exec(`sudo pmm-admin list | grep "ProxySQL" | grep "proxysql_" | awk -F" " '{print $2}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    for (const service of services) {
      let output = await cli.exec(`docker exec pxc_container_5.7 pmm-admin remove proxysql ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/proxysql-specific-tests.bats#L51
   */
  test('run pmm-admin remove proxysql again', async ({}) => {
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "ProxySQL" | awk -F" " '{print $3}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      let output = await cli.exec(`docker exec pxc_container_5.7 pmm-admin remove proxysql proxysql_${n++}`);
      await output.exitCodeEquals(1);
      await output.outContains('not found.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/proxysql-specific-tests.bats#L63
   */
  test('PMM-T965 run pmm-admin add proxysql with --agent-password flag', async ({}) => {
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "ProxySQL" | grep "proxysql_" | awk -F" " '{print $3}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      let output = await cli.exec(`docker exec pxc_container_5.7 pmm-admin add proxysql --agent-password=mypass proxysql_${n++} ${host}`);
      await output.assertSuccess();
      await output.outContains('ProxySQL Service added.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/proxysql-specific-tests.bats#L76
   */
  test('PMM-T965 check metrics from proxysql service with custom agent password', async ({}) => {
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "ProxySQL" | grep "proxysql_" | awk -F" " '{print $3}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    for (const host of hosts) {
      const serverContainer = (await cli.exec(`docker ps --format "table {{.ID}}\t{{.Image}}\t{{.Names}}" | grep 'pmm-server' | awk '{print $3}'`))
          .stdout.trim();
      //TODO: implement fluent wait instead of sleep
      await cli.exec('sleep 20');
      await (await cli.exec('sudo chmod +x /srv/pmm-qa/pmm-tests/pmm-2-0-bats-tests/check_metric.sh')).assertSuccess();
      await (await cli.exec('docker cp /srv/pmm-qa/pmm-tests/pmm-2-0-bats-tests/check_metric.sh pxc_container_5.7:/')).assertSuccess();
      let output = await cli.exec(`docker exec pxc_container_5.7 ./check_metric.sh proxysql_$COUNTER proxysql_up ${serverContainer} proxysql_exporter pmm mypass`);
      await output.assertSuccess();
      await output.outContains('proxysql_up 1');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/proxysql-specific-tests.bats#L91
   */
  test('run pmm-admin remove proxysql added with custom agent password', async ({}) => {
    let services = (await cli.exec(`sudo pmm-admin list | grep "ProxySQL" | grep "proxysql_" | awk -F" " '{print $2}'`))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    for (const service of services) {
      let output = await cli.exec(`docker exec pxc_container_5.7 pmm-admin remove proxysql ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });
});
