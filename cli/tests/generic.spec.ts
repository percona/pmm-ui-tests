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
