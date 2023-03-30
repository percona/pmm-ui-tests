import apiHelper, {Settings} from "@api/helpers/apiHelper";
import {APIResponse} from "playwright-core";

const PATH_GET = 'v1/Settings/Get';
const PATH_CHANGE = 'v1/Settings/Get';

export enum SettingProperty {
  bm = "backup_management_enabled",
}

export const settings = {
  /**
   * Looks up a single Settings Property from returned.
   *
   * Note that most of {@code false} properties are not returned.
   * So design test verifications accordingly via {@code undefined} check
   * or use getSettings() method to parse object manually for result
   *
   * @param   name  {@link SettingProperty}
   * @returns       if property found - property value; {@code undefined} otherwise
   */
  async getSettingsProperty(name: SettingProperty) {
    const responseBody = await (await apiHelper.post(PATH_GET, {})).json();
    console.log(`Response:\n${JSON.stringify(responseBody)}`);
    return Object.hasOwn(responseBody.settings, name) ? responseBody.settings[name] : undefined;
  },

  changeSettings: async (settingsData: Settings):Promise<APIResponse> => {
    return await apiHelper.post(PATH_CHANGE, {data: settingsData});
  },
};
