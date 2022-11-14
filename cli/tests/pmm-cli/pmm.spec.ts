import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cliHelper';
import assert from 'assert';

test.describe('PMM binary tests @pmm-cli', async () => {
  test('--version', async ({}) => {
    const output = await cli.exec('pmm --version');
    await output.assertSuccess();
  });

  test('server docker install ', async ({}) => {
    const output = await cli.exec('pmm server docker install --admin-password="test" --https-listen-port=443 --http-listen-port=80&> output.txt');
    // const output = await cli.exec('pmm server docker install --admin-password="test" --https-listen-port=443 --http-listen-port=80');
    // const output = await cli.exec('pmm server docker install --admin-password="test" --https-listen-port=443 --http-listen-port=80');
    await output.assertSuccess();

    await cli.asyncWaitFor(async () => {
      return (await cli.exec('cat output.txt')).toString().includes('PMM Server is now available');
    });

    await output.containsMany(['PMM Server is now available at http://localhost/']);
  });
});
