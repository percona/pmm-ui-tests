import apiHelper from '@api/helpers/api-helper';
import { APIResponse } from 'playwright-core';

const PATH = 'v1/server/settings';

export interface Settings {
  pmm_public_address: string;
}

export enum SettingProperty {
  bm = 'backup_management_enabled',
}

type SettingObject = {
  settings: { [key: string]: never },
};

export const settingsApi = {
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
  async getSettingsProperty(name: SettingProperty): Promise<string | undefined> {
    const responseBody: SettingObject = await (await apiHelper.post(PATH, {})).json();
    console.log(`Response:\n${JSON.stringify(responseBody)}`);
    return Object.hasOwn(responseBody.settings, name) ? responseBody.settings[name] as string : undefined;
  },

  changeSettings: async (settingsData: Settings): Promise<APIResponse> => {
    return apiHelper.put(PATH, { data: settingsData });
  },
};
