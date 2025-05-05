import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cli-helper';

const MONGO_USERNAME = 'pmm';
const MONGO_PASSWORD = 'pmmpass';
let mongoRplHosts: string[];
let mongoShardHosts: string[];

const replIpPort = '127.0.0.1:27017';
const mongoPushMetricsServiceName = 'mongo_push_1';
const mongoPullMetricsServiceName = 'mongo_pull_1';
const mongoServiceName = 'mongo_service_1';
const containerName = 'rs101';

test.describe('Percona Server MongoDB (PSMDB) CLI tests', async () => {
  test.beforeAll(async ({}) => {
    const result = await cli.exec(`docker ps | grep ${containerName} | awk '{print $NF}'`);
    await result.outContains(containerName, 'PSMDB rs101 docker container should exist. please run pmm-framework with --database psmdb,SETUP_TYPE=pss');
    const result1 = await cli.exec('sudo pmm-admin status');
    await result1.outContains('Running', 'pmm-client is not installed/connected locally, please run pmm3-client-setup script');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L12
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L22
   */
  test('run pmm-admin', async ({}) => {
    const sudo = parseInt((await cli.exec('id -u')).stdout, 10) === 0 ? '' : 'sudo ';
    const output = await cli.exec(`${sudo}pmm-admin`);
    await output.outContains('Usage: pmm-admin <command>');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L33
   */
  test('run pmm-admin add mongodb with metrics-mode push', async ({}) => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} --metrics-mode=push ${mongoPushMetricsServiceName} ${replIpPort}`);
    await output.assertSuccess();
    await output.outContains('MongoDB Service added');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L45
   */
  test('run pmm-admin remove mongodb instance added with metrics mode push', async ({}) => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin remove mongodb ${mongoPushMetricsServiceName}`);
    await output.assertSuccess();
    await output.outContains('Service removed.');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L58
   */
  test('run pmm-admin add mongodb with metrics-mode pull', async ({}) => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} --metrics-mode=pull ${mongoPullMetricsServiceName} ${replIpPort}`);
    await output.assertSuccess();
    await output.outContains('MongoDB Service added');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L70
   */
  test('run pmm-admin remove mongodb instance with metrics mode pull', async ({}) => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin remove mongodb ${mongoPullMetricsServiceName}`);
    await output.assertSuccess();
    await output.outContains('Service removed.');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L96
   */
  test('run pmm-admin add mongodb again based on running instances to check if fails with error message exists', async ({}) => {
    let output = await cli.exec(`sudo pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} mongo_exists ${replIpPort}`);
    await output.assertSuccess();
    await output.outContains('MongoDB Service added');
    await cli.exec('sleep 2');

    output = await cli.exec(`docker exec ${containerName} pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} mongo_exists ${replIpPort}`);
    await output.exitCodeEquals(1);
    await output.outContains('already exists.');

    output = await cli.exec(`docker exec ${containerName} pmm-admin remove mongodb mongo_exists`);
    await output.assertSuccess();
    await output.outContains('Service removed.');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L108
   */
  test("PMM-T160 User can't use both socket and address while using pmm-admin add mongodb", async ({}) => {
    const port = replIpPort.split(':')[1];
    const output = await cli.exec(`sudo pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} --socket=/tmp/mongodb-${port}.sock ${mongoServiceName} ${replIpPort}`);
    await output.exitCodeEquals(1);
    await output.outContains('Socket and address cannot be specified together.');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L148
   */
  test('PMM-T157 PMM-T161 Adding and removing MongoDB with specified socket for modb', async ({}) => {
    let output = await cli.exec(`docker exec ${containerName} pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} --socket=/tmp/mongodb-27017.sock mongo_socket`);
    await output.assertSuccess();
    await output.outContains('MongoDB Service added');
    await cli.exec('sleep 2');

    output = await cli.exec(`docker exec ${containerName} pmm-admin remove mongodb mongo_socket`);
    await output.assertSuccess();
    await output.outContains('Service removed.');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L219
   */
  test('run pmm-admin add and remove mongodb based on running instances using service-name, port, username and password labels', async ({}) => {
    const serviceName = 'mongo_host_port';
    const ip = replIpPort.split(':')[0];
    const port = replIpPort.split(':')[1];

    let output = await cli.exec(`docker exec ${containerName} pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} --host=${ip} --port=${port} --service-name=${serviceName}`);
    await output.assertSuccess();
    await output.outContains('MongoDB Service added');

    output = await cli.exec(`docker exec ${containerName} pmm-admin remove mongodb ${serviceName}`);
    await output.assertSuccess();
    await output.outContains('Service removed.');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L246
   */
  test('PMM-T964 run pmm-admin add mongodb with --agent-password flag', async ({}) => {
    const serviceName = 'mongo_agent_password';
    const ip = replIpPort.split(':')[0];
    const port = replIpPort.split(':')[1];

    let output = await cli.exec(`docker exec ${containerName} pmm-admin add mongodb --username=${MONGO_USERNAME} --password=${MONGO_PASSWORD} --host=${ip} --agent-password=mypass --port=${port} --service-name=${serviceName}`);
    await output.assertSuccess();
    await output.outContains('MongoDB Service added');

    await test.step('PMM-T964 check metrics from mongodb service with custom agent password', async () => {
      const metrics = await cli.getMetrics(serviceName, 'pmm', 'mypass', ip);
      const expectedValue = 'mongodb_up 1';
      expect(metrics, `Scraped metrics do not contain ${expectedValue}!`).toContain(expectedValue);
    });

    output = await cli.exec(`docker exec ${containerName} pmm-admin remove mongodb ${serviceName}`);
    await output.assertSuccess();
    await output.outContains('Service removed.');
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
