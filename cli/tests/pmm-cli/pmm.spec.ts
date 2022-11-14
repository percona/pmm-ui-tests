import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cliHelper';

test.describe('PMM binary tests @pmm-cli', async () => {
  test('--version', async ({}) => {
    const output = await cli.exec('pmm --version');
    await output.assertSuccess();
  });

  test('server docker install ', async ({}) => {
    const output = await cli.exec('pmm server docker install --admin-password="test" --https-listen-port=443 --http-listen-port=80');
    console.log(output);
    await output.assertSuccess();
  });
});
