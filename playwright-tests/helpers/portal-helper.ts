import { PortalUserRoles } from '@helpers/enums/portal-user-roles';
import { fileHelper } from '@helpers/file-helper';
import PortalUser from '@helpers/types/portal-user.class';
import constants from '@helpers/constants';
import { ServiceNowResponse } from '@helpers/types/service-now-response.interface';
import { api } from '@api/api';

/**
 * Collection of methods for Portal tests setup.
 */
export const portalHelper = {
  /**
   * Main Portal users provider. Encapsulates selection logic.
   * Reads users from file or creates brand new if no file. Also Created users are saved to file.
   */
  loadTestUsers: async () => {
    let firstAdmin: PortalUser;
    let secondAdmin: PortalUser;
    let technicalUser: PortalUser;
    let freeUser: PortalUser;

    if (fileHelper.fileExists(constants.portal.credentialsFile)) {
      [firstAdmin, secondAdmin, technicalUser, freeUser] = portalHelper.loadUsersFromFile();
      if (!Object.hasOwn(firstAdmin, 'org')) {
        const adminToken = await api.portal.getUserAccessToken(firstAdmin.email, firstAdmin.password);
        const orgId = Object.hasOwn(firstAdmin, 'org') ? firstAdmin.org!.id
          : (await api.portal.getOrg(adminToken)).orgs[0].id;
        firstAdmin.org = { id: orgId, role: PortalUserRoles.admin };
        secondAdmin.org = { id: orgId, role: PortalUserRoles.admin };
        technicalUser.org = { id: orgId, role: PortalUserRoles.technical };
        freeUser.org = { id: orgId, role: PortalUserRoles.admin };
      }
    } else {
      [firstAdmin, secondAdmin, technicalUser, freeUser] = await portalHelper.createNewUsers();
      fileHelper.writeToFile(constants.portal.credentialsFile, JSON.stringify([firstAdmin, secondAdmin, technicalUser, freeUser]));
    }
    return [firstAdmin, secondAdmin, technicalUser, freeUser];
  },

  /**
   * Just a wrapper to hold constants
   */
  loadUsersFromFile: (): [PortalUser, PortalUser, PortalUser, PortalUser] => {
    console.log(`Using existing users from file: ${constants.portal.credentialsFile}`);
    return JSON.parse(fileHelper.readFile(constants.portal.credentialsFile)) as [PortalUser, PortalUser, PortalUser, PortalUser];
  },

  /**
   * Encapsulates all actions required to create Portal user for tests.
   */
  createNewUsers: async () => {
    const credentials: ServiceNowResponse = await api.serviceNow.getServiceNowCredentials();
    const firstAdmin: PortalUser = await api.okta.createTestUser(credentials.contacts.admin1.email);
    const secondAdmin: PortalUser = await api.okta.createTestUser(credentials.contacts.admin2.email);
    const technicalUser: PortalUser = await api.okta.createTestUser(credentials.contacts.technical.email);
    const freeUser: PortalUser = await api.okta.createTestUser();

    const adminToken = await api.portal.getUserAccessToken(firstAdmin.email, firstAdmin.password);
    const { org } = await api.portal.createOrg(adminToken);

    await api.portal.inviteUserToOrg(adminToken, org.id, secondAdmin.email, PortalUserRoles.admin);
    await api.portal.inviteUserToOrg(adminToken, org.id, technicalUser.email, PortalUserRoles.technical);
    await api.portal.inviteUserToOrg(adminToken, org.id, freeUser.email, PortalUserRoles.admin);
    firstAdmin.org = { id: org.id, role: PortalUserRoles.admin };
    secondAdmin.org = { id: org.id, role: PortalUserRoles.admin };
    technicalUser.org = { id: org.id, role: PortalUserRoles.technical };
    freeUser.org = { id: org.id, role: PortalUserRoles.admin };

    return [firstAdmin, secondAdmin, technicalUser, freeUser];
  },

  /**
   * Encapsulates generating random Portal user(email could be specified)
   * and adding it to the admin organization with specified role.
   *
   * @param   adminUser   admin user to provide credentials and target organization for new user
   * @param   role        target {@link PortalUserRoles} role for new user to be added as
   * @param   email       optional email for user, all the rest details will be generated
   */
  addRandomUserToOrg: async (adminUser: PortalUser, role: PortalUserRoles.admin, email?: string) => {
    const randomUser: PortalUser = await api.okta.createTestUser(email || '');
    const adminToken = await api.portal.getUserAccessToken(adminUser.email, adminUser.password);
    const orgId = Object.hasOwn(adminUser, 'org') ? adminUser.org!.id
      : (await api.portal.getOrg(adminToken)).orgs[0].id;

    await api.portal.inviteUserToOrg(adminToken, orgId, randomUser.email, role);
    randomUser.org = { id: orgId, role: PortalUserRoles.admin };

    return randomUser;
  },
};
