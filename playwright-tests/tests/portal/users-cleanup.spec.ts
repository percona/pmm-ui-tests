import { test } from '@playwright/test';
import { api } from '@api/api';
import { portalHelper } from '@helpers/portal-helper';
import { fileHelper } from '@helpers/file-helper';
import constants from '@helpers/constants';
import PortalUser from '@helpers/types/portal-user.class';

/**
 * Cleanup test users and related data after Portal tests.
 * As force disconnect leaves connected server record
 */
test('Clean Up Portal tests @portal', async () => {
  test.skip(!fileHelper.fileExists(constants.portal.credentialsFile));
  let firstAdmin: PortalUser;
  let secondAdmin: PortalUser;
  let technicalUser: PortalUser;
  let freeUser: PortalUser;

  await test.step(`Read "${constants.portal.credentialsFile}" and load test users`, async () => {
    [firstAdmin, secondAdmin, technicalUser, freeUser] = portalHelper.loadUsersFromFile();
  });
  await test.step('Find and delete test organization', async () => {
    const adminToken = await api.portal.getUserAccessToken(firstAdmin.email, firstAdmin.password);
    const org = await api.portal.getOrg(adminToken);
    if (org.orgs.length) {
      await api.portal.deleteOrg(adminToken, org.orgs[0].id);
    }
  });
  await test.step('Remove tests users', async () => {
    await api.okta.deleteUsers([firstAdmin, secondAdmin, technicalUser, freeUser]);
  });
  await test.step(`Remove "${constants.portal.credentialsFile}" file`, async () => {
    fileHelper.removeFile(constants.portal.credentialsFile);
  });
});
