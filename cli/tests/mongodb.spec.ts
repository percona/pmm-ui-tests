import { test, expect } from '@playwright/test';
// import cli = require('@helpers/cliHelper'); //optional way to import with local name
import * as cli from '@helpers/cliHelper';

test.describe('MongoDB CLI tests ', async () => {

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/mongodb-tests.bats#L5
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/mongodb-tests.bats#L15
   */
  test('run pmm-admin @mongo', async ({}) => {
    const sudo = (parseInt((await cli.exec('id -u')).stdout) === 0) ? '' : 'sudo '
    let output = await cli.exec(`${sudo}pmm-admin`);
    await output.exitCodeEquals(1);
    await output.outContains('Usage: pmm-admin <command>');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/mongodb-tests.bats#L26
   */
  test('run pmm-admin add mongodb based on running instances with metrics-mode push', async ({}) => {
    // let ports = (await cli.exec(`sudo pmm-admin list | grep "MongoDB" | awk -F" " '{print $3}'`)).stdout.split('\n');
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "MongoDB" | awk -F" " '{print $3}'`))
        .stdout.trim().split('\n').filter( item => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      let output = await cli.exec(`sudo pmm-admin add mongodb --metrics-mode=push mongo_inst_${n++} ${host}`);
      await output.assertSuccess();
      await output.outContains('MongoDB Service added');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/mongodb-tests.bats#L38
   */
  test('run pmm-admin remove mongodb push', async ({}) => {
    let services = (await cli.exec(`sudo pmm-admin list | grep "MongoDB" | grep "mongo_inst_" | awk -F" " '{print $2}'`))
        .stdout.trim().split('\n').filter( item => item.trim().length > 0);
    for (const service of services) {
      let output = await cli.exec(`sudo pmm-admin remove mongodb ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }

  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/mongodb-tests.bats#L51
   */
  test('run pmm-admin add mongodb based on running instances with metrics-mode pull', async ({}) => {
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "MongoDB" | awk -F" " '{print $3}'`))
        .stdout.trim().split('\n').filter( item => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      let output = await cli.exec(`sudo pmm-admin add mongodb --metrics-mode=pull mongo_inst_${n++} ${host}`);
      await output.assertSuccess();
      await output.outContains('MongoDB Service added');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/mongodb-tests.bats#L63
   */
  test('run pmm-admin remove mongodb pull', async ({}) => {
    let services = (await cli.exec(`sudo pmm-admin list | grep "MongoDB" | grep "mongo_inst_" | awk -F" " '{print $2}'`))
        .stdout.trim().split('\n').filter( item => item.trim().length > 0);
    for (const service of services) {
      let output = await cli.exec(`sudo pmm-admin remove mongodb ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/mongodb-tests.bats#L77
   */
  test('run pmm-admin add mongodb based on running instances', async ({}) => {
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "MongoDB" | awk -F" " '{print $3}'`))
        .stdout.trim().split('\n').filter( item => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      let output = await cli.exec(`sudo pmm-admin add mongodb mongo_inst_${n++} ${host}`);
      await output.assertSuccess();
      await output.outContains('MongoDB Service added');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/mongodb-tests.bats#L89
   */
  test('run pmm-admin add mongodb again based on running instances', async ({}) => {
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "MongoDB" | awk -F" " '{print $3}'`))
        .stdout.trim().split('\n').filter( item => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      let output = await cli.exec(`sudo pmm-admin add mongodb mongo_inst_${n++} ${host}`);
      await output.exitCodeEquals(1);
      await output.outContains('already exists.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/mongodb-tests.bats#L101
   */
  test('PMM-T160 User can\'t use both socket and address while using pmm-admin add mongodb', async ({}) => {
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "MongoDB" | awk -F" " '{print $3}'`))
        .stdout.trim().split('\n').filter( item => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      console.log(host);
      const port = host.split(':')[1];
      let output = await cli.exec(`sudo pmm-admin add mongodb --socket=/tmp/mongodb-${port}.sock mongo_inst_${n++} ${host}`);
      await output.exitCodeEquals(1);
      await output.outContains('Socket and address cannot be specified together.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/mongodb-tests.bats#L116
   */
  test('run pmm-admin remove mongodb instance added based on running instances', async ({}) => {
    let services = (await cli.exec(`sudo pmm-admin list | grep "MongoDB" | grep "mongo_inst_" | awk -F" " '{print $3}'`))
        .stdout.trim().split('\n').filter( item => item.trim().length > 0);
    for (const service of services) {
      let output = await cli.exec(`sudo pmm-admin remove mongodb ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/mongodb-tests.bats#L129
   */
  test('run pmm-admin remove mongodb again', async ({}) => {
    let services = (await cli.exec(`sudo pmm-admin list | grep "MongoDB" | awk -F" " '{print $3}'`))
        .stdout.trim().split('\n').filter( item => item.trim().length > 0);
    for (const service of services) {
      let output = await cli.exec(`sudo pmm-admin remove mongodb ${service}`);
      await output.exitCodeEquals(1);
      await output.outContains('not found.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/mongodb-tests.bats#L141
   */
  test('PMM-T157 PMM-T161 Adding MongoDB with specified socket for psmdb', async ({}) => {
    // skip "Skipping this test, because of setup issue on Framework, https://jira.percona.com/browse/PMM-8708"
    test.skip(process.env.instance_t === 'modb', 'Skipping this test, because you are running for official Mongodb');
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "MongoDB" | awk -F" " '{print $3}'`))
        .stdout.trim().split('\n').filter( item => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      console.log(host);
      const port = host.split(':')[1];
      let output = await cli.exec(`sudo pmm-admin add mongodb --socket=/tmp/mongodb-${port}.sock mongo_inst_${n++}`);
      await output.assertSuccess();
      await output.outContains('MongoDB Service added');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/mongodb-tests.bats#L161
   */
  test('PMM-T157 PMM-T161 Adding MongoDB with specified socket for modb', async ({}) => {
  test.skip(true, 'Skipping this test, because of setup issue on Framework, https://jira.percona.com/browse/PMM-8708');
    test.skip(process.env.instance_t === 'mo',
        'Skipping this test, because you are running for Percona Distribution Mongodb');
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "MongoDB" | awk -F" " '{print $3}'`))
        .stdout.trim().split('\n').filter( item => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      console.log(host);
      const port = host.split(':')[1];
      let output = await cli.exec(`sudo pmm-admin add mongodb --socket=/tmp/modb_${port}/mongodb-27017.sock mongo_inst_${n++}`);
      await output.assertSuccess();
      await output.outContains('MongoDB Service added');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/mongodb-tests.bats#L182
   */
  test('run pmm-admin remove mongodb Instance added with Socket Specified', async ({}) => {
    let services = (await cli.exec(`sudo pmm-admin list | grep "MongoDB" | grep "mongo_inst_" | awk -F" " '{print $3}'`))
        .stdout.trim().split('\n').filter( item => item.trim().length > 0);
    for (const service of services) {
      let output = await cli.exec(`sudo pmm-admin remove mongodb ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/mongodb-tests.bats#L232
   */
  test('run pmm-admin add mongodb based on running instances using service-name, port',
      async ({}) => {
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "MongoDB" | awk -F" " '{print $3}'`))
        .stdout.trim().split('\n').filter( item => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      const ip = host.split(':')[0];
      const port = host.split(':')[1];
      let output = await cli.exec(`run pmm-admin add mongodb --host=${ip} --port=${port} --service-name=mongo_inst_${n++}`);
      await output.assertSuccess();
      await output.outContains('MongoDB Service added');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/mongodb-tests.bats#L246
   */
  test('run pmm-admin remove mongodb for instances added with service-name and username password labels', async ({}) => {
    let services = (await cli.exec(`sudo pmm-admin list | grep "MongoDB" | grep "mongo_inst_" | awk -F" " '{print $3}'`))
        .stdout.trim().split('\n').filter( item => item.trim().length > 0);
    for (const service of services) {
      let output = await cli.exec(`sudo pmm-admin remove mongodb ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/mongodb-tests.bats#L259
   */
  test('PMM-T964 run pmm-admin add mongodb with --agent-password flag', async ({}) => {
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "MongoDB" | awk -F" " '{print $3}'`))
        .stdout.trim().split('\n').filter( item => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      const ip = host.split(':')[0];
      const port = host.split(':')[1];
      let output = await cli.exec(`sudo pmm-admin add mongodb --host=${ip} --agent-password=mypass --port=${port} --service-name=mongo_inst_${n++}`);
      await output.assertSuccess();
      await output.outContains('MongoDB Service added');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/mongodb-tests.bats#L273
   */
  test('PMM-T964 check metrics from mongodb service with custom agent password', async ({}) => {
    test.skip(true, 'Skipping this test, because of random failure and flaky behaviour');
    let hosts = (await cli.exec(`sudo pmm-admin list | grep "MongoDB" | grep "mongo_inst_" | awk -F" " '{print $3}'`))
        .stdout.trim().split('\n').filter( item => item.trim().length > 0);
    for (const host of hosts) {
//         run sleep 20
      const ip = host.split(':')[0];
      await (await cli.exec('sudo chmod +x /srv/pmm-qa/pmm-tests/pmm-2-0-bats-tests/check_metric.sh')).assertSuccess();
      let output = await cli.exec(`/srv/pmm-qa/pmm-tests/pmm-2-0-bats-tests/check_metric.sh mongo_inst_$COUNTER mongodb_up ${ip} mongodb_exporter pmm mypass`);
      await output.assertSuccess();
      await output.outContains('mongodb_up 1');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/mongodb-tests.bats#L288
   */
  test('run pmm-admin remove mongodb added with custom agent password', async ({}) => {
    let services = (await cli.exec(`sudo pmm-admin list | grep "MongoDB" | grep "mongo_inst_" | awk -F" " '{print $3}'`))
        .stdout.trim().split('\n').filter( item => item.trim().length > 0);
    for (const service of services) {
      let output = await cli.exec(`sudo pmm-admin remove mongodb ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });
});
