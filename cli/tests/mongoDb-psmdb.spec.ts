import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cli-helper';

const MONGO_USERNAME = 'pmm';
const MONGO_PASSWORD = 'pmmpass';
let mongoRplHosts: string[];
let mongoShardHosts: string[];

const replIpPort = '127.0.0.1:27027';
// const mongosIpPort = '127.0.0.1:27017';

test.describe('Percona Server MongoDB (PSMDB) CLI tests', async () => {
  test.beforeAll(async ({}) => {
    const result = await cli.exec('docker ps | grep rs101 | awk \'{print $NF}\'');
    await result.outContains('rs101', 'PSMDB rs101 docker container should exist. please run pmm-framework with --database psmdb,SETUP_TYPE=pss');
    const result1 = await cli.exec('sudo pmm-admin status');
    await result1.outContains('Running', 'pmm-client is not installed/connected locally, please run pmm3-client-setup script');
    const output = await cli.exec(`sudo pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} prerequisite_1 ${replIpPort}`);
    await output.assertSuccess();
    // const output1 = await cli.exec(`sudo pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} prerequisite_2 ${mongosIpPort}`);
    // await output1.assertSuccess();
    mongoRplHosts = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | awk -F" " \'{print $3}\' | grep 27027'))
      .getStdOutLines();
    // mongoShardHosts = (await cli.exec('sudo pmm-admin list | grep "MongoDB" | awk -F" " \'{print $3}\'| grep 27017'))
    //  .getStdOutLines();
  });

  test.afterAll(async ({}) => {
    const output = await cli.exec('sudo pmm-admin remove mongodb prerequisite_1');
    await output.assertSuccess();
    // const output1 = await cli.exec('sudo pmm-admin remove mongodb prerequisite_2');
    // await output1.assertSuccess();
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
    for (const host of mongoRplHosts) {
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
    for (const host of mongoRplHosts) {
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
    for (const host of mongoRplHosts) {
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
    for (const host of mongoRplHosts) {
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
    const output = await cli.exec(`sudo docker exec rs101 pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} --socket=/tmp/mongodb-27017.sock mongo_socket`);
    await output.assertSuccess();
    await output.outContains('MongoDB Service added');
    await cli.exec('sleep 2');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L169
   */
  test('run pmm-admin remove mongodb Instance added with Socket Specified @imp', async ({}) => {
    const output = await cli.exec('sudo docker exec rs101 pmm-admin remove mongodb mongo_socket');
    await output.assertSuccess();
    await output.outContains('Service removed.');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L219
   */
  test('run pmm-admin add mongodb based on running instances using service-name, port, username and password labels', async ({}) => {
    let n = 1;
    for (const host of mongoRplHosts) {
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
    for (const host of mongoRplHosts) {
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

  /**
   * This test uses pmm-framework setup with pure docker environment.
  */
  test('PMM-T1853 Collect Data about Sharded collections in MongoDB', async ({}) => {
    test.skip(true, 'Skipping this test, because PSMDB Shard setup is not working on GH atm');
    let i = 1;
    for (const host of mongoShardHosts) {
      const ip = host.split(':')[0];
      const port = host.split(':')[1];
      const serviceName = `mongo_shards_test_${i++}`;
      const output = await cli.exec(`sudo pmm-admin add mongodb --host=${ip} --port=${port} --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} --service-name=${serviceName} --enable-all-collectors --agent-password='mypass'`);
      await output.assertSuccess();
      await output.outContains('MongoDB Service added');

      const expectedValue = 'mongodb_shards_collection_chunks_count';
      await expect(async () => {
        const metrics = await cli.getMetrics(serviceName, 'pmm', 'mypass');
        expect(metrics, `Scraped metrics must contain ${expectedValue}!`).toContain(expectedValue);
      }).toPass({
        intervals: [1_000],
        timeout: 5_000,
      });

      const results = await cli.exec(`sudo pmm-admin remove mongodb ${serviceName}`);
      await results.assertSuccess();
      await results.outContains('Service removed.');
    }
  });

  test('PMM-T2005 verify PBM Agent health status metric is correct', async ({}) => {
    await cli.exec('docker exec rs103 systemctl start pbm-agent');
    await expect(async () => {
      const metrics = await cli.getMetrics('rs103', 'pmm', 'mypass', 'rs103');

      expect(metrics).toContain('mongodb_pbm_agent_status{host="rs103:27017",replica_set="rs",role="S",self="1"} 0');
    }).toPass({ intervals: [2_000], timeout: 120_000 });

    await cli.exec('docker exec rs103 pkill -f pbm-agent');

    await expect(async () => {
      const metrics = await cli.getMetrics('rs103', 'pmm', 'mypass', 'rs103');

      expect(metrics).toContain('mongodb_pbm_agent_status{host="rs103:27017",replica_set="rs",role="S",self="1"} 2');
    }).toPass({ intervals: [2_000], timeout: 120_000 });

    await cli.exec('docker exec rs103 systemctl start pbm-agent');

    await expect(async () => {
      const metrics = await cli.getMetrics('rs103', 'pmm', 'mypass', 'rs103');

      expect(metrics).toContain('mongodb_pbm_agent_status{host="rs103:27017",replica_set="rs",role="S",self="1"} 0');
    }).toPass({ intervals: [2_000], timeout: 120_000 });
  });
});
