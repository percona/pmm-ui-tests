import apiHelper from '@api/helpers/api-helper';
import Wait from '@helpers/enums/wait';
import PmmVersion from '@helpers/types/pmm-version.class';
import { expect } from '@playwright/test';

export const server = {

  /**
   * @returns   Promise<PmmVersionClass>
   */
  getPmmVersion: async (): Promise<PmmVersion> => {
    const response = await apiHelper.get('/v1/version', { timeout: Wait.ThreeMinutes });
    await expect(response, `Request should be OK: "${response.status()} ${response.statusText()}" ${await response.text()}`)
      .toBeOK();
    const version = new PmmVersion((await response.json()).version as string);
    console.log(`PMM Server version: ${version}`);
    return version;
  },
};
