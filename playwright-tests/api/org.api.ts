import apiHelper from '@api/helpers/api-helper';
import { OrgUser } from '@api/api';

/**
 * grafana API: "org" endpoints requests collection
 */
export const orgApi = {
  /**
   * @param   email   email to search for the Org user.
   */
  async lookupOrgUser(email: string): Promise<OrgUser | undefined> {
    return (await this.listOrgUsers()).find((user: OrgUser) => user.email === email);
  },

  async listOrgUsers(): Promise<OrgUser[]> {
    return await (await apiHelper.get('/graph/api/org/users?accesscontrol=true')).json() as OrgUser[];
  },

  async deleteOrgUser(email: string) {
    const foundUser = (await this.listOrgUsers()).find((user: OrgUser) => user.email === email);
    if (foundUser) {
      await apiHelper.delete(`/graph/api/org/users/${foundUser.userId}`);
    }
  },
};
