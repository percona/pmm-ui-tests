import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cliHelper';
import PMMRestClient from '@support/types/request';

test.describe('PMM binary tests @pmm-cli', async () => {
  test('--version', async ({}) => {
    const output = await cli.exec('pmm --version');
    await output.assertSuccess();
  });

  test('server docker install', async ({ }) => {
    const httpPort = 80;
    const adminPassword = 'admin';
    const output = await cli.exec(
      `pmm server docker install --admin-password="${adminPassword}" --https-listen-port=443 --http-listen-port=${httpPort} --json`,
    );

    await output.assertSuccess();
    await expect(output.stderr).toContain('Starting PMM Server');
    await expect(output.stderr).toContain('Checking if container is healthy...');
    await expect(output.stderr).toContain('Password changed');

    const client = new PMMRestClient('admin', adminPassword, httpPort);
    const resp = await client.doPost('/v1/Settings/Get');
    const respBody = await resp.json() as { settings };

    expect(resp.ok()).toBeTruthy();
    expect(respBody).toHaveProperty('settings');
  });
});
