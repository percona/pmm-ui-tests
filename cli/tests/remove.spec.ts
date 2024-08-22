import { test } from '@playwright/test';
import * as cli from '@helpers/cli-helper';

const PMM_SERVER_IMAGE = process.env.DOCKER_VERSION && process.env.DOCKER_VERSION.length > 0
  ? process.env.DOCKER_VERSION
  : 'perconalab/pmm-server:dev-latest';
const PMM_CLIENT_IMAGE = process.env.CLIENT_IMAGE && process.env.CLIENT_IMAGE.length > 0
  ? process.env.CLIENT_IMAGE
  : 'perconalab/pmm-client:dev-latest';
const clientPassword = 'gfaks4d8OH';
const services = ['mysql', 'mongodb', 'postgresql', 'proxysql', 'external', 'haproxy'];

test.describe('PMM Server CLI tests for Docker Environment Variables', async () => {
  test.beforeAll(async () => {
    await cli.exec(`PMM_SERVER_IMAGE=${PMM_SERVER_IMAGE}
      PMM_CLIENT_IMAGE=${PMM_CLIENT_IMAGE}
      docker-compose -f test-setup/docker-compose-pmm-admin-remove.yml up -d`);
    await cli.exec('sleep 10');

    for (let i = 0; i < 2; i++) {
      await cli.exec(`docker exec pmm-client-remove pmm-admin add mysql --username=root --password=${clientPassword} mysql5.7 --service-name=mysql${i} mysql5.7:3306`);
      await cli.exec(`docker exec pmm-client-remove pmm-admin add mongodb --username=root --password=${clientPassword} mongo4.2 --service-name=mongodb${i} mongo4.2:27017`);
      await cli.exec(`docker exec pmm-client-remove pmm-admin add postgresql --username=postgres --password=${clientPassword} postgres11 --service-name=postgresql${i} postgres11:5432`);
      await cli.exec(`docker exec pmm-client-remove pmm-admin add proxysql --skip-connection-check --service-name=proxysql${i}`);
      await cli.exec(`docker exec pmm-client-remove pmm-admin add external --listen-port=1 --skip-connection-check --service-name=external${i}`);
      await cli.exec(`docker exec pmm-client-remove pmm-admin add haproxy --listen-port=1 --skip-connection-check haproxy${i}`);
    }
  });

  test.afterAll(async () => {
    await cli.exec('docker compose -f docker-compose-pmm-admin-remove.yml down -v');
  });

  test('PMM-T1286, PMM-T1287, PMM-T1288, PMM-T1308 - Verify service removal without specifying service name/service id', async ({}) => {
    for (let i = 0; i < services.length; i++) {
      const output = await cli.exec(`docker exec pmm-client-remove pmm-admin remove ${services[i]}`);
      await output.exitCodeEquals(1);
      await output.outContains(
        `We could not find a service associated with the local node. Please provide "Service ID" or "Service name". 
 ${output.stdout} \n ${JSON.stringify(output.stderr)} \n ${output.code}`,
      );
    }

    // remove services - only one per each database type left
    for (let i = 0; i < services.length; i++) {
      const output = await cli.exec(`docker exec pmm-client-remove pmm-admin remove ${services[i]} ${services[i]}0`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }

    // remove services with db type only
    for await (const service of services) {
      const output = await cli.exec(`docker exec pmm-client-remove pmm-admin remove ${service}`);
      await output.assertSuccess();
      await output.outContains('Service removed.');
    }
  });
});
