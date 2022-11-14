import { test, expect } from '@playwright/test';
import * as cli from '@helpers/cliHelper';
import child_process from 'node:child_process';

test.describe('PMM binary tests @pmm-cli', async () => {
  test('--version', async ({}) => {
    const output = await cli.exec('pmm --version');
    await output.assertSuccess();
  });

  test('server docker install ', async ({}) => {
    const b = child_process.execFileSync('pmm', ['server', 'docker', 'install', '--admin-password="test"', '--https-listen-port=443', '--http-listen-port=80'], { stdio: 'inherit' });

    b.forEach((a) => console.log(a));
    // const output = await cli.exec('pmm server docker install --admin-password="test" --https-listen-port=443 --http-listen-port=80');
    // const output = await cli.exec('pmm server docker install --admin-password="test" --https-listen-port=443 --http-listen-port=80');
    // await output.assertSuccess();

    // await output.containsMany(['PMM Server is now available at http://localhost/']);
  });
});
