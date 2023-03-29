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
    const version = (await response.json()).version
    const [versionMajor, versionMinor, versionPatch] = version.split('.');
    console.log(`PMM Server version: ${version}`)
    return { major: parseInt(versionMajor), minor:parseInt(versionMinor), patch:parseInt(versionPatch) };
  },
};
