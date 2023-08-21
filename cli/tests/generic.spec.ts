import { test } from '@playwright/test';
import * as cli from '@helpers/cliHelper';

 /**
   * T1258 : Verify pmm-admin status shows node name
   */
test('run pmm-status and grep NodeName', async ({}) => {
  const output = await cli.exec('sudo pmm-admin status');
  await output.assertSuccess();
  await output.outContains('Node name: client_container_');
});

test('scrape interval default value', async ({page}) => {
    const expectedScrapeSize = '64';

    await (await cli.exec(`docker-compose -f cli/test-setup/docker-compose-scrape-intervals.yml up -d`)).assertSuccess();
    await (await cli.exec('sudo pmm-admin config --force \'--server-url=https://admin:admin@0.0.0.0:1443\' --server-insecure-tls 127.0.0.1')).assertSuccess()

    const scrapeSizeContainer = await cli.exec('docker logs pmm-client-scrape-intervals 2>&1 | grep \'promscrape.maxScrapeSize.*vm_agent\' | tail -1');
    await scrapeSizeContainer.outContains(`promscrape.maxScrapeSize=\\\"${expectedScrapeSize}MiB\\\"`)

    const scrapeSizeTarball = await cli.exec('ps aux | grep -v \'grep\' | grep \'vm_agent\' | tail -1 | grep -o \'promscrape.maxScrapeSize.*vm_agent\' | tail -1')
    await scrapeSizeTarball.outContains(`promscrape.maxScrapeSize=\\\"${expectedScrapeSize}MiB\\\"`)
});

