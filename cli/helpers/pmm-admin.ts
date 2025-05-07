import { test } from '@playwright/test';
import * as cli from '@helpers/cli-helper';

export const removePGService = async (containerName: string, serviceName: string) => {
  await test.step(`remove postgresql "${serviceName}" service`, async () => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin remove postgresql ${serviceName}`);
    await output.assertSuccess();
    await output.outContains('Service removed.');
  });
};

export const removeMySQLService = async (containerName: string, serviceName: string) => {
  await test.step(`remove mysql "${serviceName}" service`, async () => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin remove mysql ${serviceName}`);
    await output.assertSuccess();
    await output.outContains('Service removed.');
  });
};

export const removeMongoService = async (containerName: string, serviceName: string) => {
  await test.step(`remove mongodb "${serviceName}" service`, async () => {
    const output = await cli.exec(`docker exec ${containerName} pmm-admin remove mongodb ${serviceName}`);
    await output.assertSuccess();
    await output.outContains('Service removed.');
  });
};
