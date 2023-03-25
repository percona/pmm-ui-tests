import apiHelper, {Settings} from "@api/helpers/apiHelper";
import {APIResponse} from "playwright-core";

const PATH_GET = 'v1/Settings/Get';
const PATH_CHANGE = 'v1/Settings/Get';

export enum SettingProperty {
  bm = "backup_management_enabled",
}

export const settingsAPIv1 = {
  /**
   * Looks up a single Setting Property from returned.
   *
   * Note that most of {@code false} properties are not returned.
   * So design test verifications accordingly via {@code undefined} check
   * or use getSettings() method to parse object manually for result
   *
   * @param  name {@link SettingProperty}
   */
  async getSettingsProperty(name: SettingProperty) {
    const responseBody = await (await apiHelper.post(PATH_GET, {})).json();
    return Object.hasOwn(responseBody, name) ? responseBody[name] : undefined;
  },

  changeSettings: async (settingsData: Settings):Promise<APIResponse> => {
    return await apiHelper.post(PATH_CHANGE, {data: settingsData});
  },
};
