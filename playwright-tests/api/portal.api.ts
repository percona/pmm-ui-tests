import { PortalUserRoles } from '@helpers/enums/portal-user-roles';
import { portalApiHelper } from './helpers/portal-api-helper';

export const portalApi = {
  async getUserAccessToken(username: string, password: string) {
    const response = await portalApiHelper.post({
      path: '/v1/auth/SignIn',
      data: {
        email: username,
        password,
      },
    });

    return response.access_token as string;
  },

  async createOrg(accessToken: string, orgName = 'Test Organization') {
    return await portalApiHelper.post({
      path: '/v1/orgs',
      accessToken,
      timeout: 120_000,
      data: { name: orgName },
    }) as { org: { id: string } };
  },

  async deleteOrg(accessToken: string, orgId: string) {
    return portalApiHelper.delete({
      path: `/v1/orgs/${orgId}`,
      timeout: 120_000,
      accessToken,
      data: {},
    });
  },

  async getOrg(accessToken: string) {
    return await portalApiHelper.post({ accessToken, path: '/v1/orgs:search' }) as { orgs: { id: string }[] };
  },

  async getOrgDetails(accessToken: string, orgId: string) {
    return portalApiHelper.get({ accessToken, path: `/v1/orgs/${orgId}` });
  },

  async inviteUserToOrg(accessToken: string, orgId: string, username: string, role: PortalUserRoles) {
    return portalApiHelper.post({
      path: `/v1/orgs/${orgId}/members`,
      accessToken,
      data: { username, role },
    });
  },

};
