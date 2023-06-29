import apiHelper from "@api/helpers/apiHelper";
import Duration from "@helpers/Duration";
import {PmmVersion} from "@helpers/PmmVersion";
import {expect} from "@playwright/test";

export const server = {

  /**
   * @returns   Promise<PmmVersion>
   */
  getPmmVersion: async (): Promise<PmmVersion> => {
    const response = await apiHelper.get('/v1/version', { timeout: Duration.ThreeMinutes });
    await expect(response,
        `Request filed: "${response.status()} ${response.statusText()}" ${await response.text()}`)
        .toBeOK();
    const version = new PmmVersion((await response.json()).version);
    console.log(`PMM Server version: ${version}`)
    return version;
  },
};
