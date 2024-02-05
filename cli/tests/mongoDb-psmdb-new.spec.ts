import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cli-helper';

const version = process.env.PSMDB_VERSION ? `${process.env.PSMDB_VERSION}` : '4.4';
const shard_container_name = `psmdb_pmm_${version}_sharded`;
test.describe('Percona Server MongoDB (PSMDB) CLI tests New', async () => {
  test('PMM-T1853 Collect Data about Sharded collections in MongoDB', async ({}) => {
    console.log(shard_container_name);
    const serviceName= 'mongo_shard_test';
    const hosts = (await cli.exec(`docker exec '${shard_container_name}' pmm-admin list | grep "mongodb_shraded_node" | awk -F" " \'{print $3}\'`))
        .stdout.trim().split('\n').filter((item) => item.trim().length > 0);
    for (const host of hosts) {
      const ip = host.split(':')[0];
      const port = host.split(':')[1];
      const output = await cli.exec(`docker exec ${shard_container_name} pmm-admin add mongodb --host=${ip} --port=${port} --service-name=${serviceName} --enable-all-collectors --agent-password='mypass'`);
      await output.assertSuccess();
      await output.outContains('MongoDB Service added');

      // Required to wait for Service to be added and Running.
      await new Promise(resolve => setTimeout(resolve, 5000));

      const metrics = await cli.getMetrics(serviceName, 'pmm', 'mypass', shard_container_name);
      const expectedValue = 'mongodb_shards_collection_chunks_count';
      expect(metrics, `Scraped metrics do not contain ${expectedValue}!`).toContain(expectedValue);

      const output1 = await cli.exec(`docker exec ${shard_container_name} pmm-admin remove mongodb ${serviceName}`);
      await output1.assertSuccess();
      await output1.outContains('Service removed.');
    }
  });
});
