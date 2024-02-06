import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cli-helper';

// if [ -z ${pmm_server_ip+x} ]; then
// export pmm_server_ip=127.0.0.1
// fi

const MONGO_USERNAME = 'pmm_mongodb';
const MONGO_PASSWORD = 'GRgrO9301RuF';

const version = process.env.PSMDB_VERSION ? `${process.env.PSMDB_VERSION}` : '6.0';
const shard_container_name = `psmdb_pmm_${version}_sharded`;

test.describe('Percona Server MongoDB (PSMDB) CLI tests ', async () => {
  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L12
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L22
   */
  test('run pmm-admin', async ({}) => {
    const sudo = parseInt((await cli.exec('id -u')).stdout) === 0 ? '' : 'sudo ';
    const output = await cli.exec(`${sudo}pmm-admin`);
    await output.exitCodeEquals(1);
    await output.outContains('Usage: pmm-admin <command>');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L33
   */
  test('run pmm-admin add mongodb based on running instances with metrics-mode push', async ({}) => {
    // let ports = (await cli.exec(`sudo pmm-admin list | grep "MongoDB" | awk -F" " '{print $3}'`)).stdout.split('\n');
    const hosts = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | awk -F" " \'{print $3}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
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
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
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
    const hosts = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | awk -F" " \'{print $3}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
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
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
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
    const hosts = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | awk -F" " \'{print $3}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      const output = await cli.exec(`sudo pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} mongo_inst_${n++} ${host}`);
      await output.assertSuccess();
      await output.outContains('MongoDB Service added');
    }
    new Promise((resolve) => setTimeout(resolve, 2000));
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L96
   */
  test('run pmm-admin add mongodb again based on running instances to check if fails with error message exists', async ({}) => {
    const hosts = (await cli.exec('sudo pmm-admin list | grep "mongo_inst_" | awk -F" " \'{print $3}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
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
    const hosts = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | awk -F" " \'{print $3}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      console.log(host);
      const port = host.split(':')[1];
      const output = await cli.exec(`sudo pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} --socket=/tmp/mongodb-${port}.sock mongo_inst_${n++} ${host}`);
      await output.exitCodeEquals(1);
      await output.outContains('Socket and address cannot be specified together.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L123
   */
  test('run pmm-admin remove mongodb instance added based on running instances', async ({}) => {
    const services = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | grep "mongo_inst_" | awk -F" " \'{print $2}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    for (const service of services) {
      const output = await cli.exec(`sudo pmm-admin remove mongodb ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L136
   */
  test('run pmm-admin remove mongodb again', async ({}) => {
    const hosts = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | awk -F" " \'{print $3}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      const output = await cli.exec(`sudo pmm-admin remove mongodb mongo_inst_${n++}`);
      await output.exitCodeEquals(1);
      await output.outContains('not found.');
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L148
   */
  test('PMM-T157 PMM-T161 Adding MongoDB with specified socket for modb', async ({}) => {
    test.skip(true, 'Skipping this test, because of random Failure');
    test.skip(process.env.instance_t === 'mo', 'Skipping this test, because you are running for Percona Distribution Mongodb');
    const hosts = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | awk -F" " \'{print $3}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
      console.log(host);
      const port = host.split(':')[1];
      const output = await cli.exec(`sudo pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} --socket=/tmp/modb_${port}/mongodb-27017.sock mongo_inst_${n++}`);
      await output.assertSuccess();
      await output.outContains('MongoDB Service added');
    }
    new Promise((resolve) => setTimeout(resolve, 2000));
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L169
   */
  test('run pmm-admin remove mongodb Instance added with Socket Specified @imp', async ({}) => {
    const services = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | grep "mongo_inst_" | awk -F" " \'{print $2}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
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
    const hosts = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | awk -F" " \'{print $3}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
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
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
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
    const hosts = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | awk -F" " \'{print $3}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    let n = 1;
    for (const host of hosts) {
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
    const hosts = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | grep "mongo_inst_" | awk -F" " \'{print $3}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    for (const host of hosts) {
      //         run sleep 20
      const ip = host.split(':')[0];
      // await (await cli.exec('sudo chmod +x /srv/pmm-qa/pmm-tests/pmm-2-0-bats-tests/check_metric.sh')).assertSuccess();
      // let output = await cli.exec(`./pmm-tests/pmm-2-0-bats-tests/check_metric.sh mongo_inst_$COUNTER mongodb_up ${ip} mongodb_exporter pmm mypass`);
      // await output.assertSuccess();
      // await output.outContains('mongodb_up 1');
      const metrics = await cli.getMetrics(host, 'pmm', 'mypass', ip);
      const expectedValue = 'mongodb_up 1';
      expect(metrics, `Scraped metrics do not contain ${expectedValue}!`).toContain(expectedValue);
    }
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L275
   */
  test('run pmm-admin remove mongodb added with custom agent password', async ({}) => {
    const services = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | grep "mongo_inst_" | awk -F" " \'{print $2}\''))
      .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    for (const service of services) {
      const output = await cli.exec(`sudo pmm-admin remove mongodb ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });

  /*
  This test uses pmm-framework setup with pure docker environment.
  */
  test('PMM-T1853 Collect Data about Sharded collections in MongoDB', async ({}) => {
    const hosts = (await cli.exec(`docker exec '${shard_container_name}' pmm-admin list | grep "mongodb_shraded_node" | awk -F" " \'{print $3}\'`))
        .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
      let i=1;
      for (const host of hosts) {
        const ip = host.split(':')[0];
        const port = host.split(':')[1];
        const serviceName= `mongo_shards_test_${i++}`;
        const output = await cli.exec(`docker exec ${shard_container_name} pmm-admin add mongodb --host=${ip} --port=${port} --service-name=${serviceName} --enable-all-collectors --agent-password='mypass'`);
        await output.assertSuccess();
        await output.outContains('MongoDB Service added');

        const expectedValue = 'mongodb_shards_collection_chunks_count';
        await expect(async () => {
          const metrics = await cli.getMetrics(serviceName, 'pmm', 'mypass', shard_container_name);
          expect(metrics, `Scraped metrics must contain ${expectedValue}!`).toContain(expectedValue);
        }).toPass({
          intervals: [1_000],
          timeout: 50_000,
        });

        const results = await cli.exec(`docker exec ${shard_container_name} pmm-admin remove mongodb ${serviceName}`);
        await results.assertSuccess();
        await results.outContains('Service removed.');
      }
  });
});
