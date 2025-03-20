import { test } from '@playwright/test';
import * as cli from '@helpers/cli-helper';

test.describe('PMM Client Docker CLI tests', async () => {
  test.beforeAll(async ({}) => {
    const result = await cli.exec('docker ps | grep pmm-client-1 | awk \'{print $NF}\'');
    await result.outContains('pmm-client-1', 'Docker container pmm-client-1 should exist. please run pmm-framework with --database dockerclients');
  });
  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pmm-client-docker-tests.bats#L6
   */
  test('run pmm-admin list on pmm-client docker container', async ({}) => {
    const output = await cli.exec('docker exec pmm-client-1 pmm-admin list');
    await output.assertSuccess();
    await output.outContainsMany([
      'Service type',
      'ps-8.0',
      'mongodb-7.0',
      'pdpgsql-1',
      'Running',
    ]);
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pmm-client-docker-tests.bats#L17
   */
  test('run pmm-admin add mysql with default options', async ({}) => {
    const output = await cli.exec('docker exec pmm-client-1 pmm-admin add mysql --username=pmm --password=pmm-pass --service-name=ps8.0_2  --host=ps-1 --port=3306 --server-url=https://admin:admin@pmm-server-1:8443 --server-insecure-tls=true');
    await output.assertSuccess();
    await output.outContains('MySQL Service added.');
    await output.outContains('ps8.0_2');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pmm-client-docker-tests.bats#L25
   */
  test('run pmm-admin remove mysql', async ({}) => {
    const output = await cli.exec('docker exec pmm-client-1 pmm-admin remove mysql ps8.0_2');
    await output.assertSuccess();
    await output.outContains('Service removed.');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pmm-client-docker-tests.bats#L32
   */
  test('run pmm-admin add mongodb with default options', async ({}) => {
    const output = await cli.exec('docker exec pmm-client-1 pmm-admin add mongodb --username=pmm --password=pmm-pass --service-name=mongodb-7.0_2  --host=psmdb-1 --port=27017 --server-url=https://admin:admin@pmm-server-1:8443 --server-insecure-tls=true');
    await output.assertSuccess();
    await output.outContains('MongoDB Service added.');
    await output.outContains('mongodb-7.0_2');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pmm-client-docker-tests.bats#L40
   */
  test('run pmm-admin remove mongodb', async ({}) => {
    const output = await cli.exec('docker exec pmm-client-1 pmm-admin remove mongodb mongodb-7.0_2');
    await output.assertSuccess();
    await output.outContains('Service removed.');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pmm-client-docker-tests.bats#L47
   */
  test('run pmm-admin add postgresql with default options', async ({}) => {
    const output = await cli.exec('docker exec pmm-client-1 pmm-admin add postgresql --username=pmm --password=pmm-pass --service-name=postgres-16_2  --host=pdpgsql-1 --port=5432 --server-url=https://admin:admin@pmm-server-1:8443 --server-insecure-tls=true');
    await output.assertSuccess();
    await output.outContains('PostgreSQL Service added.');
    await output.outContains('postgres-16_2');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pmm-client-docker-tests.bats#L55
   */
  test('run pmm-admin remove postgresql', async ({}) => {
    const output = await cli.exec('docker exec pmm-client-1 pmm-admin remove postgresql postgres-16_2');
    await output.assertSuccess();
    await output.outContains('Service removed.');
  });
});

test.describe('-promscrape.maxScapeSize tests', async () => {
  const defaultScrapeSize = '64';
  test.beforeAll(async () => {
    await (await cli.exec('docker compose -f test-setup/docker-compose-scrape-intervals.yml up -d')).assertSuccess();
  });

  test.afterAll(async () => {
    await (await cli.exec('docker compose -f test-setup/docker-compose-scrape-intervals.yml down')).assertSuccess();
  });

  test('@PMM-T1664 Verify default value for vm_agents -promscrape.maxScapeSize parameter pmm-client container', async ({}) => {
    await test.step('verify client docker logs for default value', async () => {
      await cli.exec('sleep 10');
      const scrapeSizeLog = await cli.exec('docker logs pmm-client-scrape-interval 2>&1 | grep \'promscrape.maxScrapeSize.*vm_agent\' | tail -1');
      await scrapeSizeLog.outContains(`promscrape.maxScrapeSize=\\"${defaultScrapeSize}MiB\\"`);
    });
  });

  test('@PMM-T1664 Verify default value for vm_agents -promscrape.maxScapeSize parameter local pmm-client', async ({}) => {
    await test.step('verify logs from binary for default value', async () => {
      await (await cli.exec('sudo pmm-admin config --force \'--server-url=https://admin:admin@0.0.0.0:1443\' --server-insecure-tls 127.0.0.1')).assertSuccess();
      await cli.exec('sleep 10');
      const scrapeSizeLog = await cli.exec('ps aux | grep -v \'grep\' | grep \'vm_agent\' | tail -1');
      await scrapeSizeLog.outContains(`promscrape.maxScrapeSize=${defaultScrapeSize}MiB`);
    });
  });

  test('Verify pt summary for mysql mongodb and pgsql', async ({}) => {
    await test.step('Verify pt summary returns correct exit code', async () => {
      const ptMysqlSummary = await cli.exec('docker exec pmm-client-1 /usr/local/percona/pmm/tools/pt-mysql-summary --version');
      await ptMysqlSummary.assertSuccess();

      const ptPgSummary = await cli.exec('docker exec pmm-client-1 /usr/local/percona/pmm/tools/pt-pg-summary --version');
      await ptPgSummary.assertSuccess();

      const ptMongoDbSummary = await cli.exec('docker exec pmm-client-1 /usr/local/percona/pmm/tools/pt-mongodb-summary --version');
      await ptMongoDbSummary.assertSuccess();
    });
  });
});
