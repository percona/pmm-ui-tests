import apiHelper from "@api/helpers/apiHelper";
import Duration from "@helpers/Duration";

export const server = {

  /**
   * @returns   Promise<{
   *                      major:number,
   *                      minor:number,
   *                      patch:number,
   *                     }>
   *            object with deconstructed version
   */
  getPmmVersion: async ():Promise<{major:number, minor:number, patch:number}> => {
    const response = await apiHelper.get('/v1/version', { timeout: Duration.ThreeMinutes });
    const [versionMajor, versionMinor, versionPatch] = (await response.json()).version.split('.');
    console.log(`PMM Server version: ${(await response.json()).version}`)
    return { major: parseInt(versionMajor), minor:parseInt(versionMinor), patch:parseInt(versionPatch) };
  },
};
