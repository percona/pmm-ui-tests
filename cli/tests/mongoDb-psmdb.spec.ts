import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cli-helper';
import { removeMongoService } from '@root/helpers/pmm-admin';
import { clientCredentialsFlags } from '@helpers/constants';

const replIpPort = 'rs101:27017';
const mongoPushMetricsServiceName = 'mongo_push_1';
const mongoPullMetricsServiceName = 'mongo_pull_1';
const mongoServiceName = 'mongo_service_1';
const containerName = 'rs101';

test.describe('Percona Server MongoDB (PSMDB) CLI tests', async () => {
  test.beforeAll(async ({}) => {
    const result = await cli.exec(`docker ps | grep ${containerName} | awk '{print $NF}'`);
    await result.outContains(containerName, 'PSMDB rs101 docker container should exist. please run pmm-framework with --database psmdb,SETUP_TYPE=pss');
  });

  test('run pmm-admin', async ({}) => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin`);
    await output.outContains('Usage: pmm-admin <command>');
  });

  test('run pmm-admin add mongodb with metrics-mode push', async ({}) => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin add mongodb ${clientCredentialsFlags} --metrics-mode=push ${mongoPushMetricsServiceName} ${replIpPort}`);
    await output.assertSuccess();
    await output.outContains('MongoDB Service added');

    await removeMongoService(containerName, mongoPushMetricsServiceName);
  });

  test('run pmm-admin add mongodb with metrics-mode pull', async ({}) => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin add mongodb ${clientCredentialsFlags} --metrics-mode=pull ${mongoPullMetricsServiceName} ${replIpPort}`);
    await output.assertSuccess();
    await output.outContains('MongoDB Service added');

    await removeMongoService(containerName, mongoPullMetricsServiceName);
  });

  test('run pmm-admin add mongodb again based on running instances to check if fails with error message exists', async ({}) => {
    let output = await cli.exec(`docker exec ${containerName} pmm-admin add mongodb ${clientCredentialsFlags} mongo_exists ${replIpPort}`);
    await output.assertSuccess();
    await output.outContains('MongoDB Service added');
    await cli.exec('sleep 2');

    output = await cli.exec(`docker exec ${containerName} pmm-admin add mongodb ${clientCredentialsFlags} mongo_exists ${replIpPort}`);
    await output.exitCodeEquals(1);
    await output.outContains('already exists.');

    await removeMongoService(containerName, 'mongo_exists');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L108
   */
  test("PMM-T160 User can't use both socket and address while using pmm-admin add mongodb", async ({}) => {
    const port = replIpPort.split(':')[1];
    const output = await cli.exec(`docker exec ${containerName} pmm-admin add mongodb ${clientCredentialsFlags} --socket=/tmp/mongodb-${port}.sock ${mongoServiceName} ${replIpPort}`);
    await output.exitCodeEquals(1);
    await output.outContains('Socket and address cannot be specified together.');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/modb-tests.bats#L148
   */
  test('PMM-T157 PMM-T161 Adding and removing MongoDB with specified socket for modb', async ({}) => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin add mongodb ${clientCredentialsFlags} --socket=/tmp/mongodb-27017.sock mongo_socket`);
    await output.assertSuccess();
    await output.outContains('MongoDB Service added');
    await cli.exec('sleep 2');

    await removeMongoService(containerName, 'mongo_socket');
  });

  test('run pmm-admin add and remove mongodb based on running instances using service-name, port, username and password labels', async ({}) => {
    const serviceName = 'mongo_host_port';
    const ip = replIpPort.split(':')[0];
    const port = replIpPort.split(':')[1];

    const output = await cli.exec(`docker exec ${containerName} pmm-admin add mongodb ${clientCredentialsFlags} --host=${ip} --port=${port} --service-name=${serviceName}`);
    await output.assertSuccess();
    await output.outContains('MongoDB Service added');

    await removeMongoService(containerName, serviceName);
  });

  test('PMM-T964 run pmm-admin add mongodb with --agent-password flag', async ({}) => {
    const serviceName = 'mongo_agent_password';
    const ip = replIpPort.split(':')[0];
    const port = replIpPort.split(':')[1];

    await cli.exec(`docker exec ${containerName} pmm-admin remove mongodb ${serviceName} || true`);

    const output = await cli.exec(`docker exec ${containerName} pmm-admin add mongodb ${clientCredentialsFlags} --host=${ip} --agent-password=mypass --port=${port} --service-name=${serviceName}`);
    await output.assertSuccess();
    await output.outContains('MongoDB Service added');

    await test.step('PMM-T964 check metrics from mongodb service with custom agent password', async () => {
      await expect(async () => {
        const metrics = await cli.getMetrics(serviceName, 'pmm', 'mypass', containerName);
        const expectedValue = 'mongodb_up{cluster_role="mongod"} 1';
        expect(metrics, `Scraped metrics do not contain ${expectedValue}!`).toContain(expectedValue);
      }).toPass({ intervals: [2_000], timeout: 120_000 });
    });

    await removeMongoService(containerName, serviceName);
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
