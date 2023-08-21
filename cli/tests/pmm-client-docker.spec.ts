import { test } from '@playwright/test';
import * as cli from '@helpers/cliHelper';

test.describe('PMM Client Docker CLI tests', async () => {

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pmm-client-docker-tests.bats#L6
   */
  test('run pmm-admin list on pmm-client docker container', async ({}) => {
    const output = await cli.exec('docker exec pmm-client pmm-admin list');
    await output.assertSuccess();
    await output.outContainsMany([
        'Service type',
        'ps5.7',
        'mongodb-4.0',
        'postgres-10',
        'Running',
    ]);
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pmm-client-docker-tests.bats#L17
   */
  test('run pmm-admin add mysql with default options', async ({}) => {
    let output = await cli.exec('docker exec pmm-client pmm-admin add mysql --username=root --password=root --service-name=ps5.7_2  --host=ps5.7 --port=3306 --server-url=http://admin:admin@docker-client-check-pmm-server/');
    await output.assertSuccess();
    await output.outContains('MySQL Service added.');
    await output.outContains('ps5.7_2');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pmm-client-docker-tests.bats#L25
   */
  test('run pmm-admin remove mysql', async ({}) => {
    let output = await cli.exec('docker exec pmm-client pmm-admin remove mysql ps5.7_2');
    await output.assertSuccess();
    await output.outContains('Service removed.');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pmm-client-docker-tests.bats#L32
   */
  test('run pmm-admin add mongodb with default options', async ({}) => {
    let output = await cli.exec('docker exec pmm-client pmm-admin add mongodb --service-name=mongodb-4.0_2  --host=mongodb --port=27017 --server-url=http://admin:admin@docker-client-check-pmm-server/');
    await output.assertSuccess();
    await output.outContains('MongoDB Service added.');
    await output.outContains('mongodb-4.0_2');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pmm-client-docker-tests.bats#L40
   */
  test('run pmm-admin remove mongodb', async ({}) => {
    let output = await cli.exec('docker exec pmm-client pmm-admin remove mongodb mongodb-4.0_2');
    await output.assertSuccess();
    await output.outContains('Service removed.');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pmm-client-docker-tests.bats#L47
   */
  test('run pmm-admin add postgresql with default options', async ({}) => {
    let output = await cli.exec('docker exec pmm-client pmm-admin add postgresql --username=postgres --password=postgres --service-name=postgres-10_2  --host=postgres-10 --port=5432 --server-url=http://admin:admin@docker-client-check-pmm-server/');
    await output.assertSuccess();
    await output.outContains('PostgreSQL Service added.');
    await output.outContains('postgres-10_2');
  });

  /**
   * @link https://github.com/percona/pmm-qa/blob/main/pmm-tests/pmm-2-0-bats-tests/pmm-client-docker-tests.bats#L55
   */
  test('run pmm-admin remove postgresql', async ({}) => {
    let output = await cli.exec('docker exec pmm-client pmm-admin remove postgresql postgres-10_2');
    await output.assertSuccess();
    await output.outContains('Service removed.');
  });

  test.only('@PMM-T1664 @PMM-T1665 Verify vm_agents -promscrape.maxScapeSize parameter', async ({page}) => {
    const defaultScrapeSize = '64';
    const customScrapeSize = '128';

    await test.step('verify client docker logs for default value', async () => {
      await (await cli.exec(`docker-compose -f cli/test-setup/docker-compose-scrape-intervals.yml up -d`)).assertSuccess();
      await page.waitForTimeout(10_000);

      const scrapeSizeLog = await cli.exec('docker logs pmm-client-scrape-interval 2>&1 | grep \'promscrape.maxScrapeSize.*vm_agent\' | tail -1');
      await scrapeSizeLog.outContains(`promscrape.maxScrapeSize=\\\"${defaultScrapeSize}MiB\\\"`)

    })
    await test.step('verify client docker logs for custom value', async () => {
      const scrapeSizeLog = await cli.exec('docker logs pmm-client-custom-scrape-interval 2>&1 | grep \'promscrape.maxScrapeSize.*vm_agent\' | tail -1');
      await scrapeSizeLog.outContains(`promscrape.maxScrapeSize=\\\"${customScrapeSize}MiB\\\"`)
    })

    await test.step('verify logs from binary for default value', async () => {
      await (await cli.exec('sudo pmm-admin config --force \'--server-url=https://admin:admin@0.0.0.0:1443\' --server-insecure-tls 127.0.0.1')).assertSuccess()

      const scrapeSizeLog = await cli.exec('ps aux | grep -v \'grep\' | grep \'vm_agent\' | tail -1')
      await scrapeSizeLog.outContains(`promscrape.maxScrapeSize=${defaultScrapeSize}MiB`)
    })

    await test.step('verify logs from binary for custom value', async () => {
      await (await cli.exec('sudo pmm-admin config --force \'--server-url=https://admin:admin@0.0.0.0:2443\' --server-insecure-tls 127.0.0.1')).assertSuccess()

      const scrapeSizeLog = await cli.exec('ps aux | grep -v \'grep\' | grep \'vm_agent\' | tail -1')
      await scrapeSizeLog.outContains(`promscrape.maxScrapeSize=${customScrapeSize}MiB`)
    })
  });
});
