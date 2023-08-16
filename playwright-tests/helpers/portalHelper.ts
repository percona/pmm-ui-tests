import { serviceNowAPI } from '@api/serviceNowApi';
import { portalAPI } from '@api/portalApi';
import { PortalUserRoles } from '@helpers/enums/portalUserRoles';
import { fileHelper } from '@helpers/fileHelper';
import { PortalUser } from '@helpers/types/PortalUser';
import { Constants } from '@helpers/Constants';
import * as dotenv from 'dotenv';
import { ServiceNowResponse} from '@helpers/types/serviceNowResponse.interface';
import { okta } from '@api/okta';

dotenv.config();

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

    if (fileHelper.fileExists(Constants.portal.credentialsFile)) {
      console.log(`Using existing users from file: ${Constants.portal.credentialsFile}`);
      [firstAdmin, secondAdmin, technicalUser] = JSON.parse(fileHelper.readFile(Constants.portal.credentialsFile));
    } else {
      [firstAdmin, secondAdmin, technicalUser] = await portalHelper.createNewUsers();
      fileHelper.writeToFile(Constants.portal.credentialsFile, JSON.stringify([firstAdmin, secondAdmin, technicalUser]));
    }
    return [firstAdmin, secondAdmin, technicalUser];
  },

  /**
   * Encapsulates all actions required to create Portal user for tests.
   */
  createNewUsers: async () => {
    const credentials: ServiceNowResponse = await serviceNowAPI.getServiceNowCredentials();
    const firstAdmin = await okta.createTestUser(credentials.contacts.admin1.email);
    const secondAdmin = await okta.createTestUser(credentials.contacts.admin2.email);
    const technicalUser = await okta.createTestUser(credentials.contacts.technical.email);

    const adminToken = await portalAPI.getUserAccessToken(firstAdmin.email, firstAdmin.password);
    const { org } = await portalAPI.createOrg(adminToken);

    await portalAPI.inviteUserToOrg(adminToken, org.id, secondAdmin.email, PortalUserRoles.admin);
    await portalAPI.inviteUserToOrg(adminToken, org.id, technicalUser.email, PortalUserRoles.technical);
    return [firstAdmin, secondAdmin, technicalUser];
  },
};
