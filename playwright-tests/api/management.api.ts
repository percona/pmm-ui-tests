import apiHelper from '@api/helpers/api-helper';
import { ListRoles, Role } from '@api/api';

const PATH = '/v1/accesscontrol/roles';
/**
 * v1 API: "management" endpoints requests collection
 */
export const managementApi = {
  /**
   * TODO: investigate filter stringify actually works as desired.
   *
    * @param  title         a name a role to be ctreated
   * @param   description   optional description for a role
   * @param   filter        Prometeus Filter string, ex: "{agent_type=\"mysqld_exporter\", agent_type=\"mongodb_exporter\"}"
   */
  roleCreate: async (title: string, description?: string, filter?: string) => {
    const payload: Role = {
      title, description, filter,
    };
    return (await (await apiHelper.post(PATH, payload)).json()).role_id as number;
  },

  listRoles: async (): Promise<ListRoles> => {
    return await (await apiHelper.get(PATH, {})).json() as ListRoles;
  },

  listServices: async (): Promise<any | undefined> => {
    const response = await apiHelper.get('/v1/management/services', {});
    return response.json();
  },

  async deleteRole(roleTile: string) {
    const searchResult = (await this.listRoles()).roles.find((role: Role) => role.title === roleTile);
    if (searchResult) {
      const data = { role_id: searchResult.role_id, replacement_role_id: 1 };
      await apiHelper.delete(`${PATH}/${searchResult.role_id}`, { data });
    }
  },
};
