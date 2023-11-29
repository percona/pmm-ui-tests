import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cli-helper';

// if [ -z ${pmm_server_ip+x} ]; then
// export pmm_server_ip=127.0.0.1
// fi

const MONGO_USERNAME = 'pmm_mongodb';
const MONGO_PASSWORD = 'GRgrO9301RuF';
let mongoHosts: string[];

test.describe('Percona Server MongoDB (PSMDB) CLI tests ', async () => {
  test.beforeAll(async ({}) => {
    mongoHosts = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | awk -F" " \'{print $3}\''))
      .getStdOutLines();
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L12
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L22
   */
  test('run pmm-admin', async ({}) => {
    const sudo = parseInt((await cli.exec('id -u')).stdout, 10) === 0 ? '' : 'sudo ';
    const output = await cli.exec(`${sudo}pmm-admin`);
    await output.exitCodeEquals(1);
    await output.outContains('Usage: pmm-admin <command>');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L33
   */
  test('run pmm-admin add mongodb based on running instances with metrics-mode push', async ({}) => {
    let n = 1;
    for (const host of mongoHosts) {
      const output = await cli.exec(`sudo pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} --metrics-mode=push mongo_inst_${n++} ${host}`);
      await output.assertSuccess();
      await output.outContains('MongoDB Service added');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L45
   */
  test('run pmm-admin remove mongodb instance added with metrics mode push', async ({}) => {
    const services = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | grep "mongo_inst_" | awk -F" " \'{print $2}\''))
      .getStdOutLines();
    for (const service of services) {
      const output = await cli.exec(`sudo pmm-admin remove mongodb ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L58
   */
  test('run pmm-admin add mongodb based on running instances with metrics-mode pull', async ({}) => {
    let n = 1;
    for (const host of mongoHosts) {
      const output = await cli.exec(`sudo pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} --metrics-mode=pull mongo_inst_${n++} ${host}`);
      await output.assertSuccess();
      await output.outContains('MongoDB Service added');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L70
   */
  test('run pmm-admin remove mongodb instance added with metrics mode pull', async ({}) => {
    const services = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | grep "mongo_inst_" | awk -F" " \'{print $2}\''))
      .getStdOutLines();
    for (const service of services) {
      const output = await cli.exec(`sudo pmm-admin remove mongodb ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L84
   */
  test('run pmm-admin add mongodb based on running instances', async ({}) => {
    let n = 1;
    for (const host of mongoHosts) {
      const output = await cli.exec(`sudo pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} mongo_inst_${n++} ${host}`);
      await output.assertSuccess();
      await output.outContains('MongoDB Service added');
    }
    await cli.exec('sleep 2');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L96
   */
  test('run pmm-admin add mongodb again based on running instances to check if fails with error message exists', async ({}) => {
    const hosts = (await cli.exec('sudo pmm-admin list | grep "mongo_inst_" | awk -F" " \'{print $3}\''))
      .getStdOutLines();
    let n = 1;
    for (const host of hosts) {
      const output = await cli.exec(`sudo pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} mongo_inst_${n++} ${host}`);
      await output.exitCodeEquals(1);
      await output.outContains('already exists.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L108
   */
  test("PMM-T160 User can't use both socket and address while using pmm-admin add mongodb", async ({}) => {
    let n = 1;
    for (const host of mongoHosts) {
      console.log(host);
      const port = host.split(':')[1];
      const output = await cli.exec(`sudo pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} --socket=/tmp/mongodb-${port}.sock mongo_inst_${n++} ${host}`);
      await output.exitCodeEquals(1);
      await output.outContains('Socket and address cannot be specified together.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L123
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L136
   */
  test('run pmm-admin remove mongodb instance added based on running instances', async ({}) => {
    const services = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | grep "mongo_inst_" | awk -F" " \'{print $2}\''))
      .getStdOutLines();
    for (const service of services) {
      const output = await cli.exec(`sudo pmm-admin remove mongodb ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
      const output2 = await cli.exec(`sudo pmm-admin remove mongodb ${service}`);
      await output2.exitCodeEquals(1);
      await output2.outContains('not found.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L148
   */
  test('PMM-T157 PMM-T161 Adding MongoDB with specified socket for modb', async ({}) => {
    test.skip(true, 'Skipping this test, because of random Failure');
    test.skip(process.env.instance_t === 'mo', 'Skipping this test, because you are running for Percona Distribution Mongodb');
    let n = 1;
    for (const host of mongoHosts) {
      console.log(host);
      const port = host.split(':')[1];
      const output = await cli.exec(`sudo pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} --socket=/tmp/modb_${port}/mongodb-27017.sock mongo_inst_${n++}`);
      await output.assertSuccess();
      await output.outContains('MongoDB Service added');
    }
    await cli.exec('sleep 2');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L169
   */
  test('run pmm-admin remove mongodb Instance added with Socket Specified @imp', async ({}) => {
    const services = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | grep "mongo_inst_" | awk -F" " \'{print $2}\''))
      .getStdOutLines();
    for (const service of services) {
      const output = await cli.exec(`sudo pmm-admin remove mongodb ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L219
   */
  test('run pmm-admin add mongodb based on running instances using service-name, port, username and password labels', async ({}) => {
    let n = 1;
    for (const host of mongoHosts) {
      const ip = host.split(':')[0];
      const port = host.split(':')[1];
      const output = await cli.exec(`sudo pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} --host=${ip} --port=${port} --service-name=mongo_inst_${n++}`);
      await output.assertSuccess();
      await output.outContains('MongoDB Service added');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L233
   */
  test('run pmm-admin remove mongodb for instances added with servicename and username password labels', async ({}) => {
    const services = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | grep "mongo_inst_" | awk -F" " \'{print $2}\''))
      .getStdOutLines();
    for (const service of services) {
      const output = await cli.exec(`sudo pmm-admin remove mongodb ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L246
   */
  test('PMM-T964 run pmm-admin add mongodb with --agent-password flag', async ({}) => {
    let n = 1;
    for (const host of mongoHosts) {
      const ip = host.split(':')[0];
      const port = host.split(':')[1];
      const output = await cli.exec(`sudo pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} --host=${ip} --agent-password=mypass --port=${port} --service-name=mongo_inst_${n++}`);
      await output.assertSuccess();
      await output.outContains('MongoDB Service added');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L260
   */
  test('PMM-T964 check metrics from mongodb service with custom agent password', async ({}) => {
    test.skip(true, 'Skipping this test, because of Random Failures, need to fix this');
    const services = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | grep "mongo_inst_" | awk -F" " \'{print $3}\''))
      .getStdOutLines();
    for (const service of services) {
      //         run sleep 20
      const ip = service.split(':')[0];
      const metrics = await cli.getMetrics(service, 'pmm', 'mypass', ip);
      const expectedValue = 'mongodb_up 1';
      expect(metrics, `Scraped metrics do not contain ${expectedValue}!`).toContain(expectedValue);
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L275
   */
  test('run pmm-admin remove mongodb added with custom agent password', async ({}) => {
    const services = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | grep "mongo_inst_" | awk -F" " \'{print $2}\''))
      .getStdOutLines();
    for (const service of services) {
      const output = await cli.exec(`sudo pmm-admin remove mongodb ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });
});
