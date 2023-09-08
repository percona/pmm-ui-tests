import apiHelper from '@api/helpers/api-helper';
import { ListRoles, Role } from '@api/api';

const ROLE_CREATE = '/v1/management/Role/Create';
const ROLE_LIST = '/v1/management/Role/List';
const ROLE_DELETE = '/v1/management/Role/Delete';
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
    return (await (await apiHelper.post(ROLE_CREATE, payload)).json()).role_id as number;
  },

  listRoles: async (): Promise<ListRoles> => {
    return await (await apiHelper.post(ROLE_LIST, {})).json() as ListRoles;
  },

  listServices: async (): Promise<any | undefined> => {
    const response = await apiHelper.post('/v1/management/Service/List', {});
    return response.json();
  },

  async deleteRole(roleTile: string) {
    const searchResult = (await this.listRoles()).roles.find((role: Role) => role.title === roleTile);
    if (searchResult) {
      await apiHelper.post(ROLE_DELETE, { role_id: searchResult.role_id, replacement_role_id: 1 });
    }
  },
};
