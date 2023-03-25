import apiHelper from "@api/helpers/apiHelper";
import Duration from "@helpers/Duration";

export const serverAPIv1 = {

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
    return { major: parseInt(versionMajor), minor:parseInt(versionMinor), patch:parseInt(versionPatch) };
  },
};
