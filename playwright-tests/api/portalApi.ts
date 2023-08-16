import { PortalUserRoles } from '@helpers/enums/portalUserRoles';
import { portalAPIHelper } from './helpers/portalApiHelper';

export const portalAPI = {
  async getUserAccessToken(username: string, password: string) {
    const response = await portalAPIHelper.post({
      path: '/v1/auth/SignIn',
      data: {
        email: username,
        password,
      },
    });

    return response.access_token as string;
  },

  async createOrg(accessToken: string, orgName = 'Test Organization') {
    return await portalAPIHelper.post({
      path: '/v1/orgs',
      accessToken,
      data: {
        name: orgName,
      },
    }) as { org: { id: string } };
  },

  async deleteOrg(accessToken: string, orgId: string) {
    return portalAPIHelper.delete({
      path: `/v1/orgs/${orgId}`,
      accessToken,
      data: {},
    });
  },

  async getOrg(accessToken: string) {
    return await portalAPIHelper.post({
      accessToken, path: '/v1/orgs:search',
    }) as { orgs: { id: string }[] };
  },

  async getOrgDetails(accessToken: string, orgId: string) {
    return portalAPIHelper.get({
      accessToken, path: `/v1/orgs/${orgId}`,
    });
  },

  async inviteUserToOrg(accessToken: string, orgId: string, username: string, role: PortalUserRoles) {
    return portalAPIHelper.post({
      path: `/v1/orgs/${orgId}/members`,
      accessToken,
      data: {
        username, role,
      },
    });
  },

};
