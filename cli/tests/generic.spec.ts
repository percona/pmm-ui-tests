import { test } from '@playwright/test';
import * as cli from '@helpers/cliHelper';

test('PMM-T1258 Verify pmm-admin status shows node name', async ({}) => {
  const output = await cli.exec('sudo pmm-admin status');
  await output.assertSuccess();
  await output.outContains('Node name: ');
});
