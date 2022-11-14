import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cliHelper';

test.describe('PMM binary tests ', async () => {
  test('pmm cli @pmm-cli', async ({}) => {
    const output = await cli.exec('sudo pmm --version');

    console.log(output);
    await output.assertSuccess();
  });
});
