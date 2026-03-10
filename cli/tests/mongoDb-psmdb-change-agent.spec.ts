import {test, expect} from "@playwright/test";
import * as cli from "@helpers/cli-helper";
import {getPmmAdminMinorVersion} from "@helpers/pmm-admin";
import { clientCredentialsFlags } from '@helpers/constants';

let adminVersion: number;
const newPMMPassword = 'newpmmpass';
const containerName = 'psmdb-server';

test.describe('Percona Server MongoDB (PSMDB) CLI tests', async () => {
  test.beforeAll(async ({}) => {
    const result = await cli.exec(`docker ps | grep ${containerName} | awk '{print $NF}'`);
    await result.outContains(containerName, 'PSMDB rs101 docker container should exist. please run pmm-framework with --database psmdb,SETUP_TYPE=pss');
    adminVersion = await getPmmAdminMinorVersion(containerName);
  });

  test('PMM-T2189 - Verify pmm-admin inventory change agent mongodb-exporter without agent id', async ({ }) => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin inventory change agent mongodb-exporter --password=abc | grep "pmm-admin: error: "`);
    await output.exitCodeEquals(1);
    expect(output.stderr.text).toContain('pmm-admin: error: expected "<agent-id>"');
  });
});
