import apiHelper from "@api/helpers/apiHelper";
import Duration from "@helpers/Duration";

export const server = {

  /**
   * @returns   Promise<PmmVersion>
   */
  getPmmVersion: async (): Promise<PmmVersion> => {
    const response = await apiHelper.get('/v1/version', { timeout: Duration.ThreeMinutes });
    const version = new PmmVersion((await response.json()).version);
    console.log(`PMM Server version: ${version}`)
    return version;
  },
};
