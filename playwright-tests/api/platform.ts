import apiHelper from "@api/helpers/apiHelper";

export const platform = {
  /**
   * Connects pmm to the platform.
   * @param params
   */
  async connect(serverName: string, token: string) {
    return await apiHelper.post('/v1/Platform/Connect', { data: { server_name: serverName, personal_access_token: token } });
  },
};
